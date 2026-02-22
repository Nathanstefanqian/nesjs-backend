import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT 访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: '过期时间（秒）',
    example: 86400,
  })
  expires_in: number;

  @ApiProperty({
    description: '用户信息',
    example: {
      userId: 1,
      email: 'admin@example.com',
      username: '管理员',
    },
  })
  user: {
    userId: number;
    email: string;
    username: string;
  };
}
