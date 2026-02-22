import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIModelFactory } from './services/ai-model.factory';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { ChatModule } from '../chat/chat.module';

@Global()
@Module({
  imports: [ConfigModule, ChatModule],
  controllers: [AIController],
  providers: [AIModelFactory, AIService],
  exports: [AIModelFactory, AIService],
})
export class AIModule {}
