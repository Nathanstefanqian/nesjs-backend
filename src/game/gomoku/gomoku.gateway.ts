import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GomokuService } from './gomoku.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthedSocket extends Socket {
  data: {
    user: { userId: number; username: string };
  };
}

@WebSocketGateway({
  namespace: 'gomoku',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GomokuGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gomokuService: GomokuService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: AuthedSocket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      // Ensure user object exists
      client.data.user = { userId: payload.userId, username: payload.username };
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const room = this.gomokuService.findRoomByClientId(client.id);
    if (room) {
      const updatedRoom = this.gomokuService.leaveRoom(client.id, room.roomId);
      if (updatedRoom) {
        this.server.to(room.roomId).emit('game_state', updatedRoom);
      }
    }
  }

  @SubscribeMessage('create_room')
  handleCreateRoom(@ConnectedSocket() client: AuthedSocket) {
    if (!client.data.user) return;

    const room = this.gomokuService.createRoom(client, client.data.user);
    client.join(room.roomId);

    client.emit('room_created', { roomId: room.roomId });
    this.server.to(room.roomId).emit('game_state', room);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.data.user) return;

    try {
      const room = this.gomokuService.joinRoom(
        client,
        data.roomId,
        client.data.user,
      );
      client.join(data.roomId);
      this.server.to(data.roomId).emit('game_state', room);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join_game')
  handleJoinGame(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.data.user) return;

    try {
      const room = this.gomokuService.joinGame(
        client,
        data.roomId,
        client.data.user,
      );
      this.server.to(data.roomId).emit('game_state', room);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('make_move')
  handleMakeMove(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { roomId: string; x: number; y: number },
  ) {
    try {
      const room = this.gomokuService.makeMove(
        data.roomId,
        client.id,
        data.x,
        data.y,
      );
      this.server.to(data.roomId).emit('game_state', room);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('restart_game')
  handleRestartGame(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const room = this.gomokuService.restartGame(data.roomId);
      this.server.to(data.roomId).emit('game_state', room);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.gomokuService.leaveRoom(client.id, data.roomId);
    client.leave(data.roomId);
    if (room) {
      this.server.to(data.roomId).emit('game_state', room);
    }
  }
}
