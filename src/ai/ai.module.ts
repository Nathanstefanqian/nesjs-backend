import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AIModelFactory } from './services/ai-model.factory';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { ChatModule } from '../chat/chat.module';
import {
  GeneratedImage,
  GeneratedImageSchema,
} from './schemas/generated-image.schema';

@Global()
@Module({
  imports: [
    ConfigModule,
    ChatModule,
    MongooseModule.forFeature([
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
    ]),
  ],
  controllers: [AIController],
  providers: [AIModelFactory, AIService],
  exports: [AIModelFactory, AIService],
})
export class AIModule {}
