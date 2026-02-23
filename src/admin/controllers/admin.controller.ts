import {
  Controller,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DatabaseCleanupService } from '../services/database-cleanup.service';
import { AdminService } from '../services/admin.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly cleanupService: DatabaseCleanupService,
    private readonly adminService: AdminService,
  ) {}

  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(Number(page), Number(limit), search);
  }

  @Patch('users/:id/status')
  @Roles('admin')
  @ApiOperation({ summary: '更新用户状态' })
  async updateUserStatus(
    @Param('id') id: number,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Get('ai/chats')
  @Roles('admin')
  @ApiOperation({ summary: '获取 AI 对话记录' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAiChats(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getAiChats(Number(page), Number(limit));
  }

  @Get('ai/chats/:id/messages')
  @Roles('admin')
  @ApiOperation({ summary: '获取 AI 对话详情' })
  async getChatMessages(@Param('id') id: string) {
    return this.adminService.getChatMessages(id);
  }

  @Get('ai/images')
  @Roles('admin')
  @ApiOperation({ summary: '获取 AI 生成图片记录' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAiImages(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getAiImages(Number(page), Number(limit));
  }

  @Get('games')
  @Roles('admin')
  @ApiOperation({ summary: '获取游戏对局记录' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGameRecords(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getGameRecords(Number(page), Number(limit));
  }

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: '获取统计数据' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Delete('chat/clear-all')
  @Roles('admin')
  @ApiOperation({ summary: '清空所有对话记录（危险操作）' })
  async clearAllChatData() {
    return this.cleanupService.clearAllChatData();
  }

  @Delete('chat/clear-ai')
  @Roles('admin')
  @ApiOperation({ summary: '清空 AI 对话记录' })
  async clearAiChatData() {
    return this.cleanupService.clearAiChatData();
  }

  @Delete('chat/clear-empty-ai')
  @Roles('admin')
  @ApiOperation({ summary: '清空无消息的 AI 对话记录' })
  async clearEmptyAiConversations() {
    return this.cleanupService.clearEmptyAiConversations();
  }
}
