import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FriendRequestDocument = HydratedDocument<FriendRequest>;

@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({ type: Number, required: true })
  requesterId: number;

  @Prop({ type: Number, required: true })
  addresseeId: number;

  @Prop({ required: true, enum: ['pending', 'accepted', 'rejected'] })
  status: 'pending' | 'accepted' | 'rejected';

  @Prop({ required: true, index: true, unique: true })
  pairKey: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
