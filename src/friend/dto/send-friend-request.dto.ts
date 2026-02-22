import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ description: '目标用户 ID', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  targetUserId: number;
}
