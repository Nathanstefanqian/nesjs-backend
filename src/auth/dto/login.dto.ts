import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'fungleo@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({
    description: '用户密码',
    example: 'Password123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;
}
