import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GameRecordDocument = HydratedDocument<GameRecord>;

@Schema({ timestamps: true })
export class GameRecord {
  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  blackPlayerId: number;

  @Prop({ required: true })
  blackPlayerUsername: string;

  @Prop({ required: true })
  whitePlayerId: number;

  @Prop({ required: true })
  whitePlayerUsername: string;

  @Prop({ required: true })
  winner: 'black' | 'white' | 'draw';

  @Prop({ type: [[String]], required: true }) // Store the board state or moves
  moves: string[]; // List of moves e.g., "black:7,7", "white:8,8"

  @Prop()
  startTime: Date;

  @Prop({ default: Date.now })
  endTime: Date;
}

export const GameRecordSchema = SchemaFactory.createForClass(GameRecord);
