import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { FriendService } from '../friend/friend.service';

interface AuthedSocket extends Socket {
  data: {
    user?: { userId: number; username?: string };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<number, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly friendService: FriendService,
  ) {}

  handleConnection(client: AuthedSocket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      client.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      void client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') ||
          'your-super-secret-jwt-key-change-this-in-production',
      });
      const userId = payload.userId;
      client.data.user = {
        userId,
        username: payload.username,
      };
      void client.join(`user:${userId}`);

      // Handle online status
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
        this.server.emit('user:online', { userId });
      }
      this.connectedUsers.get(userId)?.add(client.id);

      // Send online list to current user
      client.emit('users:online:list', {
        userIds: Array.from(this.connectedUsers.keys()),
      });
    } catch {
      void client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const userId = client.data.user?.userId;
    if (userId && this.connectedUsers.has(userId)) {
      const userSockets = this.connectedUsers.get(userId);
      userSockets?.delete(client.id);
      if (userSockets?.size === 0) {
        this.connectedUsers.delete(userId);
        this.server.emit('user:offline', { userId });
      }
    }
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: { conversationId?: string; participantId?: number; content: string },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { ok: false, error: '未授权' };
    }
    const content = body.content?.trim();
    if (!content) {
      return { ok: false, error: '内容不能为空' };
    }

    let conversationId = body.conversationId;
    if (!conversationId && body.participantId) {
      const conversation = await this.chatService.createUserConversation(
        userId,
        body.participantId,
      );
      conversationId = conversation._id.toString();
    }
    if (!conversationId) {
      return { ok: false, error: '对话不存在' };
    }

    const message = await this.chatService.sendUserMessage(
      conversationId,
      userId,
      content,
    );
    const conversation =
      await this.chatService.getConversationById(conversationId);
    const payload = {
      conversationId,
      message,
      conversation,
    };
    conversation.participants.forEach((participantId) => {
      this.server.to(`user:${participantId}`).emit('chat:message', payload);
    });
    return { ok: true, message, conversation };
  }

  @SubscribeMessage('friend:request')
  async handleFriendRequest(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { targetUserId: number },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { ok: false, error: '未授权' };
    }
    const request = await this.friendService.sendRequest(
      userId,
      body.targetUserId,
    );
    this.server.to(`user:${body.targetUserId}`).emit('friend:request', request);
    this.server.to(`user:${userId}`).emit('friend:request:sent', request);
    return { ok: true, request };
  }

  @SubscribeMessage('friend:accept')
  async handleFriendAccept(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { requestId: string },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { ok: false, error: '未授权' };
    }
    const request = await this.friendService.acceptRequest(
      userId,
      body.requestId,
    );
    [request.requesterId, request.addresseeId].forEach((id) => {
      this.server.to(`user:${id}`).emit('friend:accepted', request);
    });
    return { ok: true, request };
  }

  @SubscribeMessage('friend:reject')
  async handleFriendReject(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { requestId: string },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { ok: false, error: '未授权' };
    }
    const request = await this.friendService.rejectRequest(
      userId,
      body.requestId,
    );
    [request.requesterId, request.addresseeId].forEach((id) => {
      this.server.to(`user:${id}`).emit('friend:rejected', request);
    });
    return { ok: true, request };
  }

  @SubscribeMessage('friend:delete')
  async handleFriendDelete(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { targetUserId: number },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { ok: false, error: '未授权' };
    }
    await this.friendService.deleteFriend(userId, body.targetUserId);
    this.server
      .to(`user:${body.targetUserId}`)
      .emit('friend:deleted', { friendId: userId });
    return { ok: true, success: true };
  }
}
