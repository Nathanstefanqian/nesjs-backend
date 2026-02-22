# 03-LOGGING-SYSTEM (日志系统)

本文档详细解析了 `nestjs-be` 项目的日志架构，包括 Winston 集成、日志轮转策略及请求追踪。

## 1. 架构概述

日志系统是生产环境的"黑匣子"。我们使用 `winston` 替换了 NestJS 默认的 Logger，实现了：
1.  **持久化**: 日志写入文件。
2.  **轮转**: 按日期自动切割文件。
3.  **分级**: 错误日志独立存储。

## 2. 核心组件

### 2.1 Logger 配置 (`src/main.ts`)

在应用启动时注入 Winston Logger：

```typescript
const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    transports: [
      // 控制台输出 (开发环境)
      new winston.transports.Console({ ... }),
      
      // 应用日志 (application-YYYY-MM-DD.log)
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '7d', // 保留 7 天
      }),
      
      // 错误日志 (error-YYYY-MM-DD.log)
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'error-%DATE%.log',
        level: 'error', // 仅记录 error 级别
      }),
    ],
  }),
});
```

### 2.2 全局日志中间件 (`LoggerMiddleware`)

负责记录所有 HTTP 请求的入站和出站信息。

-   **入站**: `→ METHOD URL IP User-Agent`
-   **出站**: `← METHOD URL STATUS DURATION`

### 2.3 日志拦截器 (`LoggingInterceptor`)

作为补充，拦截器用于记录业务层面的执行耗时，特别是 Controller 方法的执行时间。

## 3. 日志级别与规范

-   **error**: 系统异常、数据库连接失败、500 错误。
-   **warn**: 400/404 错误、业务逻辑校验失败。
-   **log**: 正常的启动信息、关键业务操作（如"用户创建成功"）。
-   **debug**: 开发调试信息（生产环境通常关闭）。

## 4. 日志文件示例

```text
// logs/application-2026-02-15.log
[Nest] 12345  - 02/15/2026, 10:00:00 AM     LOG [RouterExplorer] Mapped {/users, GET} route +2ms
[Nest] 12345  - 02/15/2026, 10:00:05 AM     LOG [HTTP] → GET /users ::1 ...
[Nest] 12345  - 02/15/2026, 10:00:05 AM     LOG [HTTP] ← GET /users 200 15ms

// logs/error-2026-02-15.log
[Nest] 12345  - 02/15/2026, 10:05:00 AM   ERROR [AllExceptionsFilter] 500 Internal Server Error: Connection timed out...
```
