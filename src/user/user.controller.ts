import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取所有用户', description: '返回用户列表' })
  @ApiResponse({ status: 200, description: '成功返回用户列表' })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '根据 ID 获取用户',
    description: '通过用户 ID 查询单个用户信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户 ID (从1开始的整数)',
    type: Number,
  })
  @ApiResponse({ status: 200, description: '成功返回用户信息' })
  @ApiResponse({ status: 400, description: '无效的 ID 格式' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: '创建新用户', description: '创建一个新的用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: 'Email 已存在' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: '更新用户信息',
    description: '根据用户 ID 更新用户信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户 ID (从1开始的整数)',
    type: Number,
  })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  @ApiResponse({ status: 400, description: '无效的 ID 格式' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 409, description: 'Email 已存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户', description: '根据用户 ID 删除用户' })
  @ApiParam({
    name: 'id',
    description: '用户 ID (从1开始的整数)',
    type: Number,
  })
  @ApiResponse({ status: 204, description: '用户删除成功' })
  @ApiResponse({ status: 400, description: '无效的 ID 格式' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.delete(id);
  }
}

@ApiTags('test')
@Controller('test')
export class testController {
  @Public()
  @Get()
  @ApiOperation({ summary: '测试接口', description: '返回测试信息' })
  @ApiResponse({ status: 200, description: '成功返回测试信息' })
  getHello(): string {
    return '我最帅';
  }
}
