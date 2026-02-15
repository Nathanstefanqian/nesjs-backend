import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名称', example: '张三' })
  name: string;

  @ApiProperty({ description: '用户邮箱', example: 'zhangsan@example.com' })
  email: string;
}
