import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AIService } from './ai.service';
import { StreamChatDto } from './dto/stream-chat.dto';
import { GenerateTitleDto } from './dto/generate-title.dto';
import { GenerateImageDto } from './dto/generate-image.dto';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat/stream')
  @ApiOperation({ summary: 'AI 流式对话' })
  @ApiResponse({ status: 200, description: '流式返回模型输出' })
  async streamChat(
    @Body() body: StreamChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    const user = req.user as { userId: number };
    try {
      await this.aiService.streamChat(
        user.userId,
        body.message,
        body.conversationId,
        body.enableThinking,
        body.enableSearch,
        body.temperature,
        (conversationId) => {
          if (!closed) {
            res.write(`event: meta\ndata: ${conversationId}\n\n`);
          }
        },
        (chunk) => {
          if (closed) {
            return;
          }
          const data = chunk.replace(/\n/g, '\\n');
          res.write(`data: ${data}\n\n`);
        },
        (thinking) => {
          if (closed) {
            return;
          }
          const data = thinking.replace(/\n/g, '\\n');
          res.write(`event: thinking\ndata: ${data}\n\n`);
        },
      );
      if (!closed) {
        res.write('event: done\ndata: [DONE]\n\n');
        res.end();
      }
    } catch (error) {
      if (!closed) {
        const message =
          error instanceof Error ? error.message : '服务器内部错误';
        res.write(`event: error\ndata: ${message}\n\n`);
        res.end();
      }
    }
  }

  @Post('chat/title')
  @ApiOperation({ summary: '生成对话标题' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateTitle(@Body() body: GenerateTitleDto, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.aiService.generateTitle(
      user.userId,
      body.message,
      body.conversationId,
    );
  }

  @Post('image/generate')
  @ApiOperation({ summary: '生成图片' })
  @ApiResponse({ status: 200, description: '生成成功，返回图片URL' })
  async generateImage(@Body() body: GenerateImageDto, @Req() req: Request) {
    const user = req.user as { userId: number };
    const imageUrl = await this.aiService.generateImage(
      user.userId,
      body.prompt,
      body.model,
    );
    return { imageUrl };
  }
}
