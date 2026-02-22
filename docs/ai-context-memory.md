# AI 对话上下文记忆功能实现文档

本文档描述了如何在 NestJS 后端利用 LangChain 实现 AI 对话的上下文记忆功能。

## 核心逻辑

为了让 AI 模型能够理解对话的上下文（即“记忆”之前的聊天内容），我们在每次请求 AI 模型时，不仅仅发送当前的最新消息，而是将最近的历史消息一并发送给模型。

### 1. 数据流

1.  **用户发送消息**：前端发送用户消息到后端。
2.  **保存消息**：后端 `AIService` 首先调用 `ChatService` 将用户消息保存到 MongoDB 数据库。
3.  **获取历史**：`AIService` 调用 `ChatService.getMessages` 获取该对话最近的 10 条消息（包含刚刚保存的用户消息）。
4.  **构建上下文**：将 MongoDB 的消息对象转换为 LangChain 能够理解的 `HumanMessage`（用户）和 `AIMessage`（AI）对象列表。
5.  **请求模型**：将转换后的消息列表发送给 DeepSeek 模型进行流式推理。
6.  **保存回复**：将 AI 生成的完整回复保存到数据库。

## 代码实现

### 1. ChatService (获取历史消息)

在 `src/chat/chat.service.ts` 中，我们增强了 `getMessages` 方法，支持 `limit` 参数以获取最近的 N 条消息。

```typescript
// src/chat/chat.service.ts

async getMessages(
  conversationId: string,
  userId: number,
  limit?: number,
  before?: Date,
) {
  const conversation = await this.getConversationForUser(
    conversationId,
    userId,
  );

  const query: any = { conversationId: conversation._id };
  if (before) {
    query.createdAt = { $lt: before };
  }

  if (limit) {
    // 如果有 limit，获取最近的 N 条消息
    // 使用倒序排序 (createdAt: -1) 获取最新的 limit 条
    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    // 反转数组，使其按时间顺序排列 (旧 -> 新)
    return messages.reverse();
  }

  // 如果没有 limit，返回所有消息 (按时间正序)
  return this.messageModel.find(query).sort({ createdAt: 1 }).exec();
}
```

### 2. AIService (构建上下文并调用模型)

在 `src/ai/ai.service.ts` 中，我们使用 `@langchain/core/messages` 来构建消息历史。

```typescript
// src/ai/ai.service.ts
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// ...

async streamChat(
  userId: number,
  message: string,
  conversationId: string | undefined,
  onMeta: (conversationId: string) => void,
  onChunk: (chunk: string) => void,
) {
  // 1. 获取或创建对话
  const conversation = conversationId
    ? await this.chatService.getConversationForUser(conversationId, userId)
    : await this.chatService.createAiConversation(userId);
  
  // ... (省略类型检查)
  
  const conversationObjectId = conversation._id.toString();
  onMeta(conversationObjectId);

  // 2. 保存当前用户消息
  await this.chatService.appendAiMessage(
    conversation._id,
    'user',
    message,
    userId,
  );

  // 3. 获取历史消息 (用于上下文记忆)
  // 限制为最近 10 条，防止 Token 超出限制或响应过慢
  const historyMessages = await this.chatService.getMessages(conversationObjectId, userId, 10);
  
  // 4. 构建 LangChain 消息列表
  const messages = historyMessages.map((msg) => {
    if (msg.role === 'user') {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });

  // 5. 调用模型
  const model = this.aiModelFactory.createDeepSeekModel(0.7);
  // 注意：这里传入的是消息数组 (messages)，而不是单条字符串
  const stream = await model.stream(messages);

  // ... (省略流式响应处理和结果保存逻辑)
}
```

## 总结

通过上述修改，AI 对话现在具备了短期的上下文记忆能力（最近 10 条消息）。这使得用户可以进行多轮对话，例如询问“上一条回复中的 xxx 是什么意思”，AI 能够根据上下文正确作答。
