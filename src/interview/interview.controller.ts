import { Controller, Get, Sse, MessageEvent, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventService } from '../common/services/event.service';
import { Public } from '../auth/decorators/public.decorator';
import { InterviewService } from './interview.service';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';

@ApiTags('interviews')
@ApiBearerAuth('JWT-auth')
@Controller('interview')
export class InterviewController {
  constructor(
    private readonly eventService: EventService,
    private readonly interviewService: InterviewService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取面试列表' })
  findAll() {
    return [];
  }

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

  @Public()
  @Post('analyze-resume')
  @ApiOperation({
    summary: '简历分析',
    description: '根据简历内容和岗位要求生成分析报告',
  })
  @ApiResponse({ status: 200, description: '分析成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async analyzeResume(@Body() body: AnalyzeResumeDto) {
    return this.interviewService.analyzeResume(
      body.resume_content,
      body.job_description,
    );
  }
}
