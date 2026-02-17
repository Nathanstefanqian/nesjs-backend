import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

// 扩展 Express Request 类型
interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    // 验证 token (这里简化处理，实际应该验证 JWT)
    if (!this.validateToken(token)) {
      throw new UnauthorizedException('认证令牌无效');
    }

    // 将用户信息添加到请求对象
    request.user = this.getUserFromToken(token);

    return true;
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private validateToken(token: string): boolean {
    // 实际应该验证 JWT
    // 这里简化处理
    return token.length > 10;
  }

  private getUserFromToken(token: string): any {
    // 从 token 中提取用户信息
    // 这里简化处理
    console.log(token);
    return { id: 1, name: '测试用户' };
  }
}
