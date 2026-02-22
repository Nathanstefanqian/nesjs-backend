import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateTitleDto {
  @ApiProperty({
    description: '用户首条消息',
    example: '我想做一个电商网站，需要哪些模块？',
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
}
