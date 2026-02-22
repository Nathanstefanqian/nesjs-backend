import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../../chat/schemas/conversation.schema';
import {
  ChatMessage,
  ChatMessageDocument,
} from '../../chat/schemas/message.schema';

@Injectable()
export class DatabaseCleanupService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
  ) {}

  async clearAllChatData() {
    const deletedMessages = await this.messageModel.deleteMany({});
    const deletedConversations = await this.conversationModel.deleteMany({});
    return {
      message: '所有对话记录已清空',
      deletedMessages: deletedMessages.deletedCount,
      deletedConversations: deletedConversations.deletedCount,
    };
  }

  async clearAiChatData() {
    const aiConversations = await this.conversationModel.find({ type: 'ai' });
    const conversationIds = aiConversations.map((conv) => conv._id);
    const deletedMessages = await this.messageModel.deleteMany({
      conversationId: { $in: conversationIds },
    });
    const deletedConversations = await this.conversationModel.deleteMany({
      type: 'ai',
    });
    return {
      message: 'AI 对话记录已清空',
      deletedMessages: deletedMessages.deletedCount,
      deletedConversations: deletedConversations.deletedCount,
    };
  }

  async clearEmptyAiConversations() {
    const aiConversations = await this.conversationModel.find({
      type: 'ai',
    });
    let deletedCount = 0;

    for (const conv of aiConversations) {
      const messageCount = await this.messageModel.countDocuments({
        conversationId: conv._id,
      });
      if (messageCount === 0) {
        await this.conversationModel.findByIdAndDelete(conv._id);
        deletedCount++;
      }
    }

    return {
      message: '空 AI 对话记录已清理',
      deletedConversations: deletedCount,
    };
  }
}
