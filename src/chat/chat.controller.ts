import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateAiConversationDto } from './dto/create-ai-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth('JWT-auth')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: '获取对话列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getConversations(
    @Request() req: { user: { userId: number } },
    @Query('type') type?: 'ai' | 'user',
  ) {
    const { userId } = req.user;
    return this.chatService.getConversations(userId, type);
  }

  @Post('conversations')
  @ApiOperation({ summary: '创建用户对话' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createUserConversation(
    @Request() req: { user: { userId: number } },
    @Body() body: CreateConversationDto,
  ) {
    const { userId } = req.user;
    return this.chatService.createUserConversation(userId, body.participantId);
  }

  @Post('conversations/ai')
  @ApiOperation({ summary: '创建 AI 对话' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createAiConversation(
    @Request() req: { user: { userId: number } },
    @Body() body: CreateAiConversationDto,
  ) {
    const { userId } = req.user;
    console.log('Creating AI conversation with title:', body.title);
    return this.chatService.createAiConversation(userId, body.title);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: '获取对话消息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMessages(
    @Request() req: { user: { userId: number } },
    @Param('id') id: string,
  ) {
    const { userId } = req.user;
    return this.chatService.getMessages(id, userId);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: '发送消息' })
  @ApiResponse({ status: 201, description: '发送成功' })
  async sendMessage(
    @Request() req: { user: { userId: number } },
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    const { userId } = req.user;
    return this.chatService.sendUserMessage(id, userId, body.content);
  }

  @Post('conversations/:id/delete')
  @ApiOperation({ summary: '删除对话' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteConversation(
    @Request() req: { user: { userId: number } },
    @Param('id') id: string,
  ) {
    const { userId } = req.user;
    return this.chatService.deleteConversation(id, userId);
  }
}
