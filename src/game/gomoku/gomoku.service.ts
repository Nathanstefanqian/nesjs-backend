import { Injectable } from '@nestjs/common';

export interface Player {
  id: string; // Socket ID
  userId: number;
  username: string;
  color?: 'black' | 'white';
}

export interface GameRoom {
  roomId: string;
  players: Player[]; // Max 2 players
  spectators: Player[];
  board: (string | null)[][]; // 15x15 grid
  currentTurn: 'black' | 'white';
  winner: 'black' | 'white' | 'draw' | null;
  status: 'waiting' | 'playing' | 'finished';
}

@Injectable()
export class GomokuService {
  private rooms: Map<string, GameRoom> = new Map();

  createRoom(client: any, user: { userId: number; username: string }): GameRoom {
    const roomId = Math.floor(100000 + Math.random() * 900000).toString();
    const room: GameRoom = {
      roomId,
      players: [],
      spectators: [],
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      currentTurn: 'black',
      winner: null,
      status: 'waiting',
    };
    
    // Creator starts as spectator
    const spectator: Player = {
      id: client.id,
      userId: user.userId,
      username: user.username,
    };
    room.spectators.push(spectator);
    
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  findRoomByClientId(clientId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === clientId) || room.spectators.some(p => p.id === clientId)) {
        return room;
      }
    }
    return undefined;
  }

  joinRoom(client: any, roomId: string, user: { userId: number; username: string }): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player: Player = {
      id: client.id,
      userId: user.userId,
      username: user.username,
    };

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.userId === user.userId);
    if (existingPlayer) {
      existingPlayer.id = client.id; // Update socket id
      return room;
    }
    
    const existingSpectator = room.spectators.find(p => p.userId === user.userId);
    if (existingSpectator) {
        existingSpectator.id = client.id;
        return room;
    }

    // New joiners always start as spectators
    room.spectators.push(player);

    return room;
  }

  joinGame(client: any, roomId: string, user: { userId: number; username: string }): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    // Check if already playing
    if (room.players.some(p => p.userId === user.userId)) {
        throw new Error('You are already in the game');
    }

    if (room.players.length >= 2) {
        throw new Error('Game is full');
    }

    // Find in spectators and remove
    const spectatorIndex = room.spectators.findIndex(p => p.userId === user.userId);
    if (spectatorIndex !== -1) {
        room.spectators.splice(spectatorIndex, 1);
    }

    const player: Player = {
        id: client.id,
        userId: user.userId,
        username: user.username,
    };

    // Assign color
    if (room.players.length === 0) {
        player.color = 'black';
    } else {
        // If one player exists, assign the opposite color
        player.color = room.players[0].color === 'black' ? 'white' : 'black';
    }

    room.players.push(player);

    if (room.players.length === 2) {
        room.status = 'playing';
        // Reset board if game was finished
        if (room.winner) {
            room.winner = null;
            room.board = Array(15).fill(null).map(() => Array(15).fill(null));
            room.currentTurn = 'black';
        }
    }

    return room;
  }

  leaveRoom(clientId: string, roomId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerIndex = room.players.findIndex(p => p.id === clientId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      room.status = 'waiting';
      room.winner = null;
      room.board = Array(15).fill(null).map(() => Array(15).fill(null));
      room.currentTurn = 'black';
      // Promote spectator if any? Maybe later.
      return room;
    }

    const spectatorIndex = room.spectators.findIndex(p => p.id === clientId);
    if (spectatorIndex !== -1) {
      room.spectators.splice(spectatorIndex, 1);
    }

    if (room.players.length === 0 && room.spectators.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    return room;
  }

  makeMove(roomId: string, clientId: string, x: number, y: number): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.id === clientId);
    if (!player) throw new Error('Player not in room');

    if (room.status !== 'playing') throw new Error('Game not in progress');
    if (room.winner) throw new Error('Game finished');
    if (player.color !== room.currentTurn) throw new Error('Not your turn');

    if (room.board[y][x] !== null) throw new Error('Invalid move');

    // Update board
    room.board[y][x] = player.color!;

    // Check win
    if (this.checkWin(room.board, x, y, player.color!)) {
      room.winner = player.color!;
      room.status = 'finished';
    } else {
        // Check draw
        if (room.board.every(row => row.every(cell => cell !== null))) {
            room.winner = 'draw';
            room.status = 'finished';
        } else {
             // Switch turn
            room.currentTurn = room.currentTurn === 'black' ? 'white' : 'black';
        }
    }

    return room;
  }

  restartGame(roomId: string): GameRoom {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');
      
      room.board = Array(15).fill(null).map(() => Array(15).fill(null));
      room.winner = null;
      room.currentTurn = 'black';
      room.status = room.players.length === 2 ? 'playing' : 'waiting';
      
      return room;
  }

  private checkWin(board: (string | null)[][], x: number, y: number, color: string): boolean {
    const directions = [
      [1, 0],   // Horizontal
      [0, 1],   // Vertical
      [1, 1],   // Diagonal \
      [1, -1],  // Diagonal /
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // Check forward
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== color) break;
        count++;
      }

      // Check backward
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== color) break;
        count++;
      }

      if (count >= 5) return true;
    }

    return false;
  }
}
