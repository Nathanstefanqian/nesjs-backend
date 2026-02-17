import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description:
      '使用邮箱和密码登录，返回 JWT token。登录成功后，点击右上角 Authorize 按钮，输入返回的 access_token 即可访问需要认证的接口。',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功，返回 access_token',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '需要在请求头中携带 JWT token',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权或 token 无效' })
  getProfile(@CurrentUser() user: any) {
    return {
      message: '获取用户信息成功',
      user: user as { id: number; email: string; name?: string },
    };
  }
}
