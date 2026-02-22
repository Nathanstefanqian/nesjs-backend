import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, enum: ['ai', 'user'] })
  type: 'ai' | 'user';

  @Prop({ type: [Number], required: true, index: true })
  participants: number[];

  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  lastMessagePreview: string;

  @Prop({ type: Date, default: null })
  lastMessageAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
