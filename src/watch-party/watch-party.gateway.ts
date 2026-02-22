import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WatchPartyService } from './watch-party.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'watch-party',
})
export class WatchPartyGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly watchPartyService: WatchPartyService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const result = this.watchPartyService.leaveRoom(client.id);
    if (result) {
      this.server
        .to(result.roomId)
        .emit('user_left', { userId: result.userId });
    }
  }

  @SubscribeMessage('create_room')
  createRoom(
    @MessageBody() data: { hostId: string; hostName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.watchPartyService.createRoom(
      data.hostId,
      data.hostName,
      client.id,
    );
    client.join(room.roomId);
    return { event: 'room_created', data: room };
  }

  @SubscribeMessage('join_room')
  joinRoom(
    @MessageBody()
    data: { roomId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = this.watchPartyService.joinRoom(
        data.roomId,
        data.userId,
        data.userName,
        client.id,
      );
      client.join(room.roomId);
      this.server.to(room.roomId).emit('user_joined', {
        userId: data.userId,
        userName: data.userName,
        members: room.members,
      });
      return { event: 'room_joined', data: room };
    } catch (error) {
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('update_state')
  updateState(
    @MessageBody()
    data: {
      roomId: string;
      userId: string;
      state: {
        isPlaying?: boolean;
        currentTime?: number;
        videoUrl?: string;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Only host can update
      const room = this.watchPartyService.getRoom(data.roomId);
      if (!room) return;

      if (room.hostId !== data.userId) {
        // client.emit('error', 'Only host can control video');
        return;
      }

      this.watchPartyService.updateVideoState(
        data.roomId,
        data.userId,
        data.state,
      );

      client.to(data.roomId).emit('state_updated', data.state);
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('sync_request')
  syncRequest(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // A new user might ask for current state
    const room = this.watchPartyService.getRoom(data.roomId);
    if (room) {
      client.emit('sync_response', {
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        videoUrl: room.videoUrl,
      });
    }
  }

  @SubscribeMessage('send_message')
  sendMessage(
    @MessageBody()
    data: {
      roomId: string;
      userId: string;
      userName: string;
      message: string;
    },
  ) {
    this.server.to(data.roomId).emit('new_message', data);
  }
}
