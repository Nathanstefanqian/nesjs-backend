import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './controllers/admin.controller';
import { AdminDebugController } from './controllers/admin-debug.controller';
import { DatabaseCleanupService } from './services/database-cleanup.service';
import {
  Conversation,
  ConversationSchema,
} from '../chat/schemas/conversation.schema';
import { ChatMessage, ChatMessageSchema } from '../chat/schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [AdminController, AdminDebugController],
  providers: [DatabaseCleanupService],
  exports: [DatabaseCleanupService],
})
export class AdminModule {}
