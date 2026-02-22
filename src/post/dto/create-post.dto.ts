import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'NestJS 自动 CRUD 实战', description: '文章标题' })
  title: string;

  @ApiProperty({
    example: '使用泛型和继承实现高效开发...',
    description: '文章内容',
  })
  content: string;

  @ApiProperty({
    example: 'published',
    description: '文章状态',
    required: false,
  })
  status?: string;
}
