import { Controller, Get, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventService } from '../common/services/event.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('interviews')
@ApiBearerAuth('JWT-auth')
@Controller('interview')
export class InterviewController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: '获取面试列表' })
  findAll() {
    return [];
  }

  /**
   * SSE 接口：实时推送消息
   */
  @Public()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.eventService.generateTimedMessages().pipe(
      map(
        (message) =>
          ({
            data: JSON.stringify({
              timestamp: new Date().toISOString(),
              message: message,
            }),
          }) as MessageEvent,
      ),
    );
  }
}
