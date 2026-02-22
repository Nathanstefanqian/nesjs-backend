import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: '对话对象用户 ID', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  participantId: number;
}
