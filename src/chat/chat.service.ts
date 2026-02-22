import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { ChatMessage, ChatMessageDocument } from './schemas/message.schema';
import { FriendService } from '../friend/friend.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
    private readonly friendService: FriendService,
  ) {}

  async getConversations(userId: number, type?: 'ai' | 'user') {
    const query = type
      ? { participants: userId, type }
      : { participants: userId };
    return this.conversationModel
      .find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();
  }

  async createUserConversation(userId: number, participantId: number) {
    const isFriend = await this.friendService.isFriends(userId, participantId);
    if (!isFriend) {
      throw new ForbiddenException('请先添加好友');
    }
    const existing = await this.conversationModel.findOne({
      type: 'user',
      participants: { $all: [userId, participantId] },
    });
    if (existing) {
      return existing;
    }
    return this.conversationModel.create({
      type: 'user',
      participants: [userId, participantId],
      title: '',
    });
  }

  async createAiConversation(userId: number, title?: string) {
    return this.conversationModel.create({
      type: 'ai',
      participants: [userId],
      title: title || 'AI 对话',
    });
  }

  async getConversationForUser(conversationId: string, userId: number) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('对话不存在');
    }
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('无权访问该对话');
    }
    return conversation;
  }

  async getConversationById(conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('对话不存在');
    }
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }
    return conversation;
  }

  async updateConversationTitle(conversationId: string, title: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('对话不存在');
    }
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }
    if (conversation.title && conversation.title.trim().length > 0) {
      return conversation;
    }
    conversation.title = title;
    await conversation.save();
    return conversation;
  }

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
      const messages = await this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
      return messages.reverse();
    }

    return this.messageModel.find(query).sort({ createdAt: 1 }).exec();
  }

  async sendUserMessage(
    conversationId: string,
    userId: number,
    content: string,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('对话不存在');
    }
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('无权访问该对话');
    }
    if (conversation.type === 'user') {
      const [first, second] = conversation.participants;
      const isFriend = await this.friendService.isFriends(first, second);
      if (!isFriend) {
        throw new ForbiddenException('请先添加好友');
      }
    }
    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderId: userId,
      role: 'user',
      content,
    });
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessagePreview: content.slice(0, 100),
      lastMessageAt: new Date(),
    });
    return message;
  }

  async appendAiMessage(
    conversationId: Types.ObjectId,
    role: 'user' | 'assistant',
    content: string,
    senderId: number | null,
    reasoning_content?: string,
  ) {
    await this.messageModel.create({
      conversationId,
      senderId,
      role,
      content,
      reasoning_content,
    });
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessagePreview: content.slice(0, 100),
      lastMessageAt: new Date(),
    });
  }

  async deleteConversation(conversationId: string, userId: number) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('对话不存在');
    }
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('无权删除该对话');
    }
    await this.conversationModel.findByIdAndDelete(conversationId);
    await this.messageModel.deleteMany({ conversationId: conversationId });
    return { success: true };
  }
}
