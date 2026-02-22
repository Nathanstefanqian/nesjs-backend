import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class StreamChatDto {
  @ApiProperty({
    description: '用户消息',
    example: '你好，请用三句话介绍 NestJS。',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiProperty({
    description: '对话 ID',
    example: '66b9f1c7c8c4f1a2b3c4d5e6',
    required: false,
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({
    description: '是否开启深度思考',
    example: true,
    required: false,
  })
  @IsOptional()
  enableThinking?: boolean;

  @ApiProperty({
    description: '是否开启联网搜索',
    example: false,
    required: false,
  })
  @IsOptional()
  enableSearch?: boolean;

  @ApiProperty({
    description: '温度 (0.0 - 2.0)',
    example: 0.7,
    required: false,
  })
  @IsOptional()
  temperature?: number;
}
