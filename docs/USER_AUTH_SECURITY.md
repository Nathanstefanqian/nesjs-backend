# 用户认证与安全实现文档

本文档详细说明了项目中用户认证、密码安全处理及相关逻辑的实现细节。

## 1. 核心功能概述

本次更新主要增强了用户数据的安全性和系统的可维护性：

1.  **密码自动加密**：在用户数据保存到数据库之前，自动对密码进行哈希加密。
2.  **安全比对**：登录时使用安全的方式比对明文密码与数据库中的哈希密码。
3.  **日志审计**：记录关键操作（如用户保存）的日志。

## 2. 技术栈

- **框架**: NestJS + Mongoose
- **加密库**: `bcryptjs` (轻量级且兼容性好的加密库)
- **类型支持**: TypeScript

## 3. 实现细节

### 3.1 用户 Schema 定义 (`src/user/schemas/user.schema.ts`)

我们扩展了 `User` Schema，增加了中间件（Hooks）和实例方法。

#### 3.1.1 密码加密钩子 (`pre('save')`)

这是一个 Mongoose 中间件，在文档执行 `save()` 方法之前自动触发。

```typescript
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;

  // 1. 检查密码是否被修改
  // 如果只是更新邮箱或用户名，不需要重新加密密码
  if (!user.isModified('password')) {
    return next();
  }

  try {
    // 2. 生成盐 (Salt)
    // 盐的强度设置为 10，平衡了安全性与性能
    const salt = await bcrypt.genSalt(10);
    
    // 3. 加密密码
    // 将明文密码替换为哈希后的密文
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
```

#### 3.1.2 操作日志钩子 (`post('save')`)

在文档成功保存后触发，用于记录系统日志。

```typescript
UserSchema.post('save', function (doc, next) {
  console.log(`用户 ${doc.username} 已保存`);
  next();
});
```

#### 3.1.3 密码比对方法 (`comparePassword`)

我们在 Schema 上定义了一个实例方法，用于验证用户输入的密码是否正确。

```typescript
// 定义类型接口，确保 TypeScript 能识别该方法
export type UserDocument = HydratedDocument<User> & {
  comparePassword: (password: string) => Promise<boolean>;
};

// 实现方法
UserSchema.methods.comparePassword = async function (password: string) {
  const user = this as UserDocument;
  // 使用 bcrypt.compare 安全地比对明文和密文
  return bcrypt.compare(password, user.password);
};
```

### 3.2 认证服务 (`src/auth/auth.service.ts`)

在登录逻辑中，我们不再直接比较字符串，而是调用 Schema 中定义的方法。

```typescript
async login(loginDto: LoginDto): Promise<LoginResponseDto> {
  // 1. 查找用户
  const user = await this.userModel.findOne({ email: loginDto.email }).exec();
  
  // ... 用户不存在的处理 ...

  // 2. 验证密码
  // 使用我们在 Schema 中定义的 comparePassword 方法
  const isPasswordValid = await user.comparePassword(loginDto.password);

  if (!isPasswordValid) {
    this.logger.warn('Password mismatch');
    throw new UnauthorizedException('邮箱或密码错误');
  }

  // 3. 生成 Token ...
}
```

## 4. 优势

1.  **安全性**: 数据库中不再存储明文密码。即使数据库泄露，攻击者也无法直接获取用户密码。
2.  **解耦**: 加密逻辑封装在 Schema 层面，业务代码（Service）不需要关心加密细节，只需要调用 `save()` 即可。
3.  **一致性**: 无论是在注册、重置密码还是管理员修改密码的场景下，只要调用了 `save()`，密码都会被自动加密，防止遗漏。
