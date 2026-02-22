import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Number, default: null })
  senderId: number | null;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, required: false })
  reasoning_content?: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
