import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoTask, VideoTaskSchema } from './schemas/video-task.schema';
import { VideoTaskController } from './video-task.controller';
import { VideoTaskService } from './video-task.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoTask.name, schema: VideoTaskSchema },
    ]),
    AIModule,
  ],
  controllers: [VideoTaskController],
  providers: [VideoTaskService],
  exports: [VideoTaskService],
})
export class VideoTaskModule {}
