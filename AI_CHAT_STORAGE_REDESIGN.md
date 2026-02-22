# AI 对话存储方案重构

## 问题分析

原有方案存在的问题：
1. **数据同步冲突**：本地临时消息和服务器消息之间存在竞态条件
2. **过度刷新**：频繁从服务器重新加载消息，导致本地消息被覆盖
3. **ID 不一致**：本地临时 ID 和服务器 ID 不匹配，难以追踪消息状态

## 新方案设计

### 核心原则
1. **单一数据源**：服务器是唯一的真实数据源
2. **乐观更新**：本地先显示，后台同步
3. **状态追踪**：明确标记消息的同步状态

### 消息状态定义

```typescript
type MessageStatus = 
  | 'sending'    // 正在发送到服务器
  | 'streaming'  // AI 正在流式返回
  | 'synced'     // 已同步到服务器
  | 'failed'     // 发送失败
```

### 数据流程

#### 1. 发送消息
```
用户输入 → 添加本地消息(status: sending) → 调用 API → 
收到服务器响应 → 更新消息 ID 和状态(status: synced)
```

#### 2. AI 流式响应
```
开始流式传输 → 创建本地消息(status: streaming) → 
逐步追加内容 → 流式结束 → 标记为 synced
```

#### 3. 切换对话
```
切换对话 → 清空当前消息 → 从服务器加载历史消息 → 
全部标记为 synced
```

### 实现细节

#### 前端 Store 改造

```typescript
interface ChatMessage {
  id: string;              // 本地临时 ID 或服务器 ID
  serverId?: string;       // 服务器返回的真实 ID
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;   // 新增状态字段
  createdAt: number;
}
```

#### 关键逻辑

1. **发送消息时**
   - 生成本地临时 ID
   - 立即添加到 UI（status: sending）
   - 调用 API 后更新 serverId 和 status

2. **流式响应时**
   - 创建本地消息（status: streaming）
   - 逐步追加内容
   - 完成后标记 status: synced

3. **加载历史消息时**
   - 只在切换对话或首次加载时调用
   - 不在流式传输过程中调用
   - 所有历史消息标记为 synced

4. **避免重复加载**
   - 使用 ref 追踪加载状态
   - 流式传输期间禁止重新加载
   - 使用防抖避免频繁请求

### 优势

1. ✅ **用户体验好**：消息立即显示，无闪烁
2. ✅ **数据一致性**：明确的状态管理
3. ✅ **错误处理**：可以重试失败的消息
4. ✅ **性能优化**：减少不必要的网络请求

## 清空数据库

使用以下 API 清空数据：

```bash
# 清空所有对话记录
DELETE http://localhost:3000/admin/chat/clear-all

# 只清空 AI 对话记录
DELETE http://localhost:3000/admin/chat/clear-ai
```

## 前端本地存储清理

```javascript
// 清空 Zustand 持久化存储
localStorage.removeItem('chat-storage');
```

