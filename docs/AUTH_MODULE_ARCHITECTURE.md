# Auth 模块架构与功能详细分析

本文档详细分析了 `src/auth` 模块的架构设计、核心组件、认证流程以及与其他模块的集成方式。

## 1. 模块概述

Auth 模块主要负责系统的身份认证（Authentication）和授权（Authorization）基础。它基于 JWT (JSON Web Token) 标准，结合 `Passport.js` 策略模式，实现了无状态的身份验证机制。

### 核心功能
- **用户登录**：验证邮箱和密码，生成 JWT 访问令牌。
- **全局守卫**：通过全局守卫拦截所有请求，验证 Token 有效性。
- **公开接口豁免**：提供 `@Public()` 装饰器，允许特定接口跳过认证。
- **用户解析**：从 Token 中解析用户信息，并注入到请求对象中。

---

## 2. 架构设计

Auth 模块采用了 NestJS 的标准模块化架构，利用依赖注入（DI）和装饰器模式实现了松耦合的设计。

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

---

## 3. 核心组件详解

### 3.1 AuthModule (`auth.module.ts`)
模块的入口文件，负责组装和配置所有依赖。
- **JwtModule 配置**：使用 `registerAsync` 异步加载配置（从 `ConfigService` 获取 `JWT_SECRET` 和 `JWT_EXPIRES_IN`）。
- **MongooseModule**：引入 `User` 模型，用于验证用户信息。
- **PassportModule**：集成 Passport 认证库。
- **Providers/Exports**：注册并导出 `AuthService` 和 `JwtModule`，使其在其他模块可用。

### 3.2 JwtAuthGuard (`jwt-auth.guard.ts`)
这是系统的**全局认证守卫**，在 `AppModule` 中通过 `APP_GUARD` 注册。
- **继承关系**：继承自 `@nestjs/passport` 的 `AuthGuard('jwt')`。
- **主要逻辑 (`canActivate`)**：
  1. 使用 `Reflector` 检查目标处理程序（Handler）或类（Class）是否标记了 `IS_PUBLIC_KEY` 元数据。
  2. 如果标记为 Public，则直接放行（`return true`）。
  3. 否则，调用父类的 `super.canActivate()` 执行标准的 JWT 验证逻辑。

### 3.3 JwtStrategy (`jwt.strategy.ts`)
定义了具体的 JWT 验证策略，由 `Passport` 库调用。
- **Token 提取**：从请求头的 `Authorization: Bearer <token>` 中提取。
- **密钥验证**：使用环境变量中的 `JWT_SECRET` 验证签名。
- **Payload 验证 (`validate`)**：
  - 接收解码后的 Payload。
  - 检查 `userId` 是否存在。
  - 返回简化的用户信息对象 `{ userId, username, roles }`。
  - **注意**：返回值会被 Passport 自动挂载到 `request.user` 上。

### 3.4 AuthService (`auth.service.ts`)
包含核心业务逻辑。
- **login(loginDto)**：
  1. 根据邮箱查找用户。
  2. 调用 User 模型的方法验证密码（`user.comparePassword`）。
  3. 生成包含 `userId`、`email`、`username` 的 Payload。
  4. 调用 `jwtService.sign` 签署 Token。
  5. 返回标准的 JWT 响应结构（access_token, expires_in, etc.）。

### 3.5 AuthController (`auth.controller.ts`)
暴露 HTTP 接口。
- **POST /auth/login**：公开接口（`@Public`），用于获取 Token。
- **GET /auth/profile**：受保护接口，演示如何通过 `@CurrentUser` 获取当前登录用户信息。

---

## 4. 关键装饰器与工具

### 4.1 @Public() (`decorators/public.decorator.ts`)
- **作用**：将路由标记为公开，跳过全局 JWT 验证。
- **实现**：使用 `SetMetadata` 设置键为 `isPublic` 的元数据。

### 4.2 @CurrentUser() (`decorators/current-user.decorator.ts`)
- **作用**：参数装饰器，用于在 Controller 中直接获取 `request.user` 对象。
- **实现**：`ctx.switchToHttp().getRequest().user`。

---

## 5. 数据模型集成

Auth 模块与 User 模块紧密集成，依赖于 `UserSchema` (`src/user/schemas/user.schema.ts`) 中的安全机制：
- **密码哈希**：利用 Mongoose 的 `pre('save')` 钩子，在保存用户前自动使用 `bcryptjs` 对密码进行加盐哈希。
- **密码比对**：User 模型实例提供了 `comparePassword` 方法，用于在登录时验证明文密码与数据库哈希值是否匹配。

---

## 6. 配置与环境变量

模块依赖以下环境变量（通过 `ConfigService` 获取）：
- `JWT_SECRET`: JWT 签名密钥（必须保密）。
- `JWT_EXPIRES_IN`: Token 过期时间（如 '1d', '3600s'）。

---

## 7. 常见问题排查

### 401 Unauthorized 原因
如果访问接口返回 401，通常有以下原因：
1. **未携带 Token**：请求头缺少 `Authorization: Bearer ...`。
2. **Token 无效/过期**：签名不匹配或已过有效期。
3. **接口未公开**：目标接口没有添加 `@Public()` 装饰器，且全局守卫处于激活状态。
   - *案例*：之前 `PostController` 的 `findAll` 方法未加 `@Public()`，导致未登录用户无法查看文章列表。

### 冗余文件说明
- `src/auth/auth.guard.ts`：这是一个手动实现的 Guard 示例，但在当前架构中**未被使用**。系统实际使用的是 `JwtAuthGuard`。