# 02-EXCEPTION-HANDLING (异常处理)

本文档详细解析了 `nestjs-be` 项目的异常处理机制，包括异常过滤器的层级设计、MongoDB 错误处理及统一响应格式。

## 1. 设计理念

NestJS 内置的异常处理虽然强大，但返回的格式不统一（HTTP 错误 vs 数据库错误）。我们需要一个机制来：
1.  **统一格式**: 无论发生什么错误，前端收到的 JSON 结构必须一致。
2.  **隐藏细节**: 生产环境不能暴露堆栈信息。
3.  **日志记录**: 所有异常都应被记录，便于排查。

## 2. 过滤器层级 (Filter Hierarchy)

我们构建了一个责任链式的异常处理系统，按注册顺序执行：

```text
请求 → 控制器 → 抛出异常
         ↓
    异常过滤器链（Global Filters）
         ↓
1. MongoExceptionFilter（处理 MongoDB 特定错误）
         ↓
2. HttpExceptionFilter（处理 HTTP 状态码错误）
         ↓
3. AllExceptionsFilter（兜底：处理所有未捕获异常）
         ↓
    返回统一响应
```

## 3. 过滤器详解

### 3.1 AllExceptionsFilter (全局兜底)

-   **捕获范围**: 所有异常 (`@Catch()`)。
-   **逻辑**:
    -   判断异常类型：如果是 `HttpException`，提取状态码；否则默认 500。
    -   记录日志：500 错误记录 `error` 级别，其他记录 `warn` 级别。
    -   构造标准响应。

### 3.2 MongoExceptionFilter (数据库错误)

-   **捕获范围**: `MongoError`。
-   **常见错误处理**:
    -   `E11000` (Duplicate Key): 转换为 `409 Conflict`，提示"数据已存在"。
    -   `ValidationError`: 转换为 `400 Bad Request`。

### 3.3 HttpExceptionFilter (业务异常)

-   **捕获范围**: `HttpException`。
-   **用途**: 处理业务逻辑中主动抛出的错误，如 `NotFoundException`。

## 4. 统一响应格式

所有过滤器最终都会返回如下格式的 JSON：

```json
{
  "statusCode": 404,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/users/123",
  "method": "GET",
  "message": "用户不存在"
}
```

## 5. 最佳实践

在 Service 或 Controller 中，你应该直接抛出标准的 HTTP 异常，而不是手动 try-catch：

```typescript
// ✅ 推荐做法
async findOne(id: number) {
  const user = await this.userModel.findById(id);
  if (!user) {
    throw new NotFoundException('用户不存在'); // 过滤器会自动处理
  }
  return user;
}

// ❌ 不推荐做法
async create(dto: CreateDto) {
  try {
    await this.userModel.create(dto);
  } catch (e) {
    // 不要在这里手动处理 MongoDB 错误码，交给 MongoExceptionFilter
    return { code: 500, msg: e.message }; 
  }
}
```
