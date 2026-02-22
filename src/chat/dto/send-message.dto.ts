import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: '消息内容', example: '你好' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}
