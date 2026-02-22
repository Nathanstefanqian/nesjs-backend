import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAiConversationDto {
  @ApiProperty({
    description: '对话标题',
    example: 'New Chat',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;
}
