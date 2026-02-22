
import { Injectable } from '@nestjs/common';

export interface RoomMember {
  id: string; // userId or socketId
  name: string;
  socketId: string;
}

export interface RoomState {
  roomId: string;
  hostId: string; // userId of the host
  hostName: string;
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number; // in seconds
  lastUpdated: number; // timestamp
  members: RoomMember[];
}

@Injectable()
export class WatchPartyService {
  private rooms: Map<string, RoomState> = new Map();
  // Map socketId to roomId for quick lookup on disconnect
  private socketToRoom: Map<string, string> = new Map();

  createRoom(hostId: string, hostName: string, socketId: string): RoomState {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: RoomState = {
      roomId,
      hostId,
      hostName,
      videoUrl: '', // Initial empty state
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      members: [{ id: hostId, name: hostName, socketId }],
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socketId, roomId);
    return room;
  }

  joinRoom(
    roomId: string,
    userId: string,
    userName: string,
    socketId: string,
  ): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is already in the room (update socketId)
    const existingMember = room.members.find((m) => m.id === userId);
    if (existingMember) {
      existingMember.socketId = socketId;
    } else {
      room.members.push({ id: userId, name: userName, socketId });
    }

    this.socketToRoom.set(socketId, roomId);
    return room;
  }

  leaveRoom(socketId: string): {
    roomId: string;
    userId: string;
    remainingMembers: number;
  } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const memberIndex = room.members.findIndex((m) => m.socketId === socketId);
    let userId = '';

    if (memberIndex !== -1) {
      userId = room.members[memberIndex].id;
      room.members.splice(memberIndex, 1);
    }

    this.socketToRoom.delete(socketId);

    // If room is empty, delete it
    if (room.members.length === 0) {
      this.rooms.delete(roomId);
      return { roomId, userId, remainingMembers: 0 };
    }

    // If host left, assign new host (optional, but for now let's say room persists without host or assign to next)
    if (userId === room.hostId && room.members.length > 0) {
      room.hostId = room.members[0].id;
      room.hostName = room.members[0].name;
    }

    return { roomId, userId, remainingMembers: room.members.length };
  }

  updateVideoState(
    roomId: string,
    userId: string,
    state: Partial<RoomState>,
  ): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    if (room.hostId !== userId) {
      throw new Error('Only host can control video');
    }

    if (state.videoUrl !== undefined) room.videoUrl = state.videoUrl;
    if (state.isPlaying !== undefined) room.isPlaying = state.isPlaying;
    if (state.currentTime !== undefined) room.currentTime = state.currentTime;

    room.lastUpdated = Date.now();

    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }
}
