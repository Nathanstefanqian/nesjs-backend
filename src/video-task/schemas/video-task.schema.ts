import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoTaskDocument = VideoTask & Document;

@Schema({ timestamps: true })
export class VideoTask {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  song: string;

  @Prop()
  snippet: string;

  @Prop({
    type: String,
    enum: [
      'fisheye',
      'handheld-indoor',
      'handheld-outdoor',
      'fixed-indoor',
      'other',
    ],
    default: 'other',
  })
  angle: string;

  @Prop({
    type: String,
    enum: ['pending', 'filmed', 'edited', 'completed'],
    default: 'pending',
  })
  status: string;
}

export const VideoTaskSchema = SchemaFactory.createForClass(VideoTask);
