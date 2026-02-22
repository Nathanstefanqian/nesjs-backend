import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseController } from '../common/base/base.controller';
import { PostService } from './post.service';
import { PostDocument } from './schemas/post.schema';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('posts')
@Controller('post')
export class PostController extends BaseController<PostDocument> {
  constructor(private readonly postService: PostService) {
    super(postService);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取文章列表 (公开)' })
  async findAll(@Query() query: any) {
    return super.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取文章详情 (公开)' })
  async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }
}
