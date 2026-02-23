import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './controllers/admin.controller';
import { AdminDebugController } from './controllers/admin-debug.controller';
import { DatabaseCleanupService } from './services/database-cleanup.service';
import { AdminService } from './services/admin.service';
import {
  Conversation,
  ConversationSchema,
} from '../chat/schemas/conversation.schema';
import { ChatMessage, ChatMessageSchema } from '../chat/schemas/message.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import {
  GeneratedImage,
  GeneratedImageSchema,
} from '../ai/schemas/generated-image.schema';
import {
  GameRecord,
  GameRecordSchema,
} from '../game/schemas/game-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
      { name: GameRecord.name, schema: GameRecordSchema },
    ]),
  ],
  controllers: [AdminController, AdminDebugController],
  providers: [DatabaseCleanupService, AdminService],
  exports: [DatabaseCleanupService, AdminService],
})
export class AdminModule {}
