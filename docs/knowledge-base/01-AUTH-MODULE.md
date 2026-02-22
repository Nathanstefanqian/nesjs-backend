# 01-AUTH-MODULE (认证与安全)

本文档详细解析了 `nestjs-be` 项目的认证模块架构、JWT 实现细节以及用户安全策略。

## 1. 模块架构 (Architecture)

Auth 模块主要负责系统的身份认证（Authentication）和授权（Authorization）。

### 组件依赖关系
```mermaid
graph TD
    AppModule -->|Imports| AuthModule
    AppModule -->|Providers (APP_GUARD)| JwtAuthGuard
    
    AuthModule -->|Imports| JwtModule
    AuthModule -->|Imports| PassportModule
    AuthModule -->|Imports| MongooseModule(User)
    
    AuthController --> AuthService
    AuthService --> JwtService
    AuthService --> UserModel
    
    JwtAuthGuard --> Reflector
    JwtAuthGuard -->|Extends| AuthGuard('jwt')
    
    JwtStrategy -->|Validates| Token
```

### 核心组件详解

1.  **AuthModule**: 模块入口，负责异步加载 JWT 配置 (`JWT_SECRET`, `JWT_EXPIRES_IN`)，并注入 Passport 和 Mongoose 依赖。
2.  **JwtAuthGuard**: 全局守卫，拦截所有请求。
    *   检查 `@Public()` 装饰器：如果存在，直接放行。
    *   否则，执行 JWT 验证逻辑。
3.  **JwtStrategy**: 定义 Passport 验证策略。
    *   从 `Authorization: Bearer <token>` 提取 Token。
    *   验证签名并解析 Payload。
    *   将解析出的用户信息挂载到 `req.user`。
4.  **AuthService**: 核心业务逻辑。
    *   `login()`: 验证邮箱密码，签发 Token。

## 2. 安全机制 (Security)

### 密码加密 (`bcryptjs`)

我们在 `UserSchema` 中使用了 Mongoose Hooks 来自动处理密码安全，确保**业务逻辑层（Service）不接触明文密码的加密过程**。

**User Schema Hooks (`src/user/schemas/user.schema.ts`):**

```typescript
// pre('save') 钩子：保存前自动加密
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  
  // 仅在密码字段被修改时才重新加密
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10); // 生成盐
    user.password = await bcrypt.hash(user.password, salt); // 哈希加密
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：安全比对密码
UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};
```

### 登录验证流程

1.  用户提交 `email` 和 `password`。
2.  `AuthService` 根据 `email` 查找用户。
3.  调用 `user.comparePassword(password)` 验证密码。
4.  验证通过后，生成包含 `userId` 和 `email` 的 JWT Token。

## 3. 使用指南 (Usage Guide)

### 3.1 获取 Token (登录)

**请求**:
```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": { ... }
}
```

### 3.2 访问受保护接口

在请求头中添加 `Authorization`:

```http
GET /users/profile
Authorization: Bearer <access_token>
```

### 3.3 开发装饰器

-   **`@Public()`**: 标记接口为公开，跳过认证。
-   **`@CurrentUser()`**: 在 Controller 中快速获取当前用户信息。

```typescript
@Public()
@Get('public-data')
getPublic() { ... }

@Get('profile')
getProfile(@CurrentUser() user: any) { ... }
```
