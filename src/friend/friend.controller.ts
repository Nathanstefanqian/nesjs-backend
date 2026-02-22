import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FriendService } from './friend.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@ApiTags('friends')
@ApiBearerAuth('JWT-auth')
@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  @ApiOperation({ summary: '获取好友列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFriends(@Request() req: { user: { userId: number } }) {
    return this.friendService.getFriends(req.user.userId);
  }

  @Get('requests')
  @ApiOperation({ summary: '获取好友请求' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRequests(@Request() req: { user: { userId: number } }) {
    return this.friendService.getRequests(req.user.userId);
  }

  @Post('requests')
  @ApiOperation({ summary: '发送好友请求' })
  @ApiResponse({ status: 201, description: '发送成功' })
  async sendRequest(
    @Request() req: { user: { userId: number } },
    @Body() body: SendFriendRequestDto,
  ) {
    return this.friendService.sendRequest(req.user.userId, body.targetUserId);
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: '接受好友请求' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async acceptRequest(
    @Request() req: { user: { userId: number } },
    @Param('id') id: string,
  ) {
    return this.friendService.acceptRequest(req.user.userId, id);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: '拒绝好友请求' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async rejectRequest(
    @Request() req: { user: { userId: number } },
    @Param('id') id: string,
  ) {
    return this.friendService.rejectRequest(req.user.userId, id);
  }

  @Delete(':targetUserId')
  @ApiOperation({ summary: '删除好友' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteFriend(
    @Request() req: { user: { userId: number } },
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.friendService.deleteFriend(req.user.userId, targetUserId);
  }
}
