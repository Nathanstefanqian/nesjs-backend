import { Controller, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseCleanupService } from '../services/database-cleanup.service';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminController {
  constructor(private readonly cleanupService: DatabaseCleanupService) {}

  @Delete('chat/clear-all')
  @ApiOperation({ summary: '清空所有对话记录（危险操作）' })
  async clearAllChatData() {
    return this.cleanupService.clearAllChatData();
  }

  @Delete('chat/clear-ai')
  @ApiOperation({ summary: '清空 AI 对话记录' })
  async clearAiChatData() {
    return this.cleanupService.clearAiChatData();
  }

  @Delete('chat/clear-empty-ai')
  @ApiOperation({ summary: '清空无消息的 AI 对话记录' })
  async clearEmptyAiConversations() {
    return this.cleanupService.clearEmptyAiConversations();
  }
}
