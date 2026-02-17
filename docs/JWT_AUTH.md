# JWT 认证使用说明

## 配置

在 `.env` 文件中配置 JWT 密钥：

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

## 使用方法

### 1. 登录获取 Token

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

响应：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "admin",
    "roles": ["user", "admin"]
  }
}
```

### 2. 使用 Token 访问受保护的接口

在请求头中添加 Authorization：

```bash
GET /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 标记公共路由（不需要认证）

使用 `@Public()` 装饰器：

```typescript
import { Public } from './auth/decorators/public.decorator';

@Public()
@Get('public')
getPublicData() {
  return 'This is public';
}
```

### 4. 获取当前用户信息

使用 `@CurrentUser()` 装饰器：

```typescript
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Get('profile')
getProfile(@CurrentUser() user: any) {
  return user;
}
```

## Swagger 文档

访问 `http://localhost:3000/api` 查看 API 文档。

在 Swagger 中使用认证：
1. 点击右上角的 "Authorize" 按钮
2. 输入 Token（不需要 "Bearer " 前缀）
3. 点击 "Authorize"
4. 现在可以测试需要认证的接口了

