# 异常处理器说明

## 什么是异常处理器？

异常处理器（Exception Filter）是 NestJS 中用于统一处理应用程序中所有异常的机制。它可以捕获不同类型的错误，并返回统一格式的错误响应。

## 为什么需要异常处理器？

### 1. 统一错误响应格式
没有异常处理器时，不同的错误可能返回不同的格式：
```json
// HTTP 异常
{ "statusCode": 404, "message": "Not Found" }

// 数据库错误
{ "error": "MongoError: E11000 duplicate key error..." }

// 未处理的错误
服务器直接崩溃或返回 HTML 错误页面
```

有了异常处理器，所有错误都返回统一格式：
```json
{
  "statusCode": 404,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/users/123",
  "method": "GET",
  "message": "用户不存在"
}
```

### 2. 友好的错误提示
- 将技术性错误转换为用户友好的提示
- 例如：MongoDB 的 `E11000` 错误 → "数据已存在，请检查唯一字段"

### 3. 安全性
- 在生产环境隐藏敏感的错误信息（如堆栈跟踪）
- 防止泄露系统内部实现细节

### 4. 日志记录
- 自动记录所有错误到日志系统
- 方便排查问题和监控系统健康状态

## 我们创建的异常处理器

### 1. AllExceptionsFilter（全局异常过滤器）
- **作用**：捕获所有类型的异常
- **使用场景**：作为最后的兜底，确保任何错误都能被处理
- **特点**：
  - 区分 HTTP 异常和其他异常
  - 500 错误记录详细日志，400 错误记录警告日志
  - 返回统一的错误响应格式

### 2. HttpExceptionFilter（HTTP 异常过滤器）
- **作用**：专门处理 NestJS 的 HttpException
- **使用场景**：处理业务逻辑中主动抛出的异常
- **示例**：
```typescript
throw new NotFoundException('用户不存在');
throw new BadRequestException('参数错误');
throw new UnauthorizedException('未授权');
```

### 3. MongoExceptionFilter（MongoDB 异常过滤器）
- **作用**：专门处理 MongoDB 数据库错误
- **使用场景**：数据库操作失败时
- **处理的错误**：
  - `11000`：重复键错误（如 email 已存在）
  - `121`：文档验证失败
  - 其他数据库错误

### 4. GlobalExceptionFilter（全局错误过滤器）
- **作用**：捕获所有未被其他过滤器处理的 Error 对象
- **使用场景**：处理意外的系统错误
- **特点**：开发环境显示详细错误，生产环境隐藏细节

## 实际应用示例

### 示例 1：用户不存在
```typescript
// 控制器代码
async findOne(id: number) {
  const user = await this.userService.findOne(id);
  if (!user) {
    throw new NotFoundException('用户不存在');
  }
  return user;
}

// 返回给客户端
{
  "statusCode": 404,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/users/999",
  "method": "GET",
  "message": "用户不存在"
}
```

### 示例 2：Email 重复
```typescript
// 创建用户时，email 已存在
// MongoDB 抛出 E11000 错误

// MongoExceptionFilter 自动处理，返回：
{
  "statusCode": 409,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "数据已存在，请检查唯一字段"
}
```

### 示例 3：参数验证失败
```typescript
// 使用 class-validator 验证失败
// ValidationPipe 抛出 BadRequestException

// HttpExceptionFilter 处理，返回：
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/users",
  "method": "POST",
  "message": ["email must be an email", "age must be a number"]
}
```

## 异常过滤器的执行顺序

```
请求 → 控制器 → 抛出异常
         ↓
    异常过滤器链（按注册顺序）
         ↓
1. MongoExceptionFilter（处理 MongoDB 错误）
         ↓
2. HttpExceptionFilter（处理 HTTP 异常）
         ↓
3. AllExceptionsFilter（处理所有其他异常）
         ↓
    返回统一的错误响应
```

## 总结

异常处理器的核心作用：
1. ✅ **统一错误格式** - 让前端更容易处理错误
2. ✅ **友好的提示** - 将技术错误转换为用户能理解的信息
3. ✅ **安全保护** - 隐藏敏感信息
4. ✅ **日志记录** - 方便排查问题
5. ✅ **代码简洁** - 不需要在每个地方都写 try-catch

没有异常处理器 = 错误信息混乱、不安全、难以维护
有了异常处理器 = 错误处理统一、安全、易于维护

