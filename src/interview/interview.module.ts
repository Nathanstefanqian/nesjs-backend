import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { EventService } from '../common/services/event.service';

@Module({
  controllers: [InterviewController],
  providers: [InterviewService, EventService],
})
export class InterviewModule {}
