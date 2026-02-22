import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminDebugController {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
  ) {}

  @Get('chat/stats')
  @ApiOperation({ summary: '查看数据库统计信息' })
  async getChatStats() {
    const totalConversations = await this.conversationModel.countDocuments();
    const aiConversations = await this.conversationModel.countDocuments({
      type: 'ai',
    });
    const userConversations = await this.conversationModel.countDocuments({
      type: 'user',
    });
    const totalMessages = await this.messageModel.countDocuments();

    const recentConversations = await this.conversationModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return {
      stats: {
        totalConversations,
        aiConversations,
        userConversations,
        totalMessages,
      },
      recentConversations: recentConversations.map((conv) => ({
        id: conv._id,
        type: conv.type,
        title: conv.title,
        participants: conv.participants,
        createdAt: conv.createdAt,
      })),
    };
  }
}
