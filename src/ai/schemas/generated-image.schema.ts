import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GeneratedImageDocument = GeneratedImage & Document;

@Schema({ timestamps: true })
export class GeneratedImage {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  prompt: string;

  @Prop()
  model: string;

  @Prop()
  aspectRatio: string;

  @Prop()
  seed: number;

  @Prop()
  cost: number;

  @Prop({ default: 'CNY' })
  currency: string;
}

export const GeneratedImageSchema = SchemaFactory.createForClass(GeneratedImage);
