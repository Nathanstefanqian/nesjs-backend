import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: '用户名称', example: '张三', required: false })
  name?: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'zhangsan@example.com',
    required: false,
  })
  email?: string;
}
