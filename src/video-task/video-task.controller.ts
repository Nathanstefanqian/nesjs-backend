import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VideoTaskService } from './video-task.service';
import { CreateVideoTaskDto, UpdateVideoTaskDto } from './dto/video-task.dto';

@ApiTags('video-task')
@Controller('video-task')
@UseGuards(JwtAuthGuard)
export class VideoTaskController {
  constructor(private readonly videoTaskService: VideoTaskService) {}

  @Post('generate-auto')
  @ApiOperation({ summary: 'Auto generate video tasks via AI' })
  generateAuto(@Req() req: any) {
    return this.videoTaskService.generateAuto(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new video task' })
  create(@Req() req: any, @Body() createVideoTaskDto: CreateVideoTaskDto) {
    return this.videoTaskService.create(req.user.userId, createVideoTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all video tasks for current user' })
  findAll(@Req() req: any) {
    return this.videoTaskService.findAll(req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a video task' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateVideoTaskDto: UpdateVideoTaskDto,
  ) {
    return this.videoTaskService.update(
      id,
      req.user.userId,
      updateVideoTaskDto,
    );
  }

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete video tasks' })
  removeMany(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.videoTaskService.removeMany(body.ids, req.user.userId);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all video tasks' })
  removeAll(@Req() req: any) {
    return this.videoTaskService.removeAll(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video task' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.videoTaskService.remove(id, req.user.userId);
  }
}
