import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '用户名称',
    example: 'zhangsan',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(2, 20)
  username?: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'zhangsan@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
