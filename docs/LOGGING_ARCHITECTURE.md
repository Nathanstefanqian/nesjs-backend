# 日志架构文档

## 1. 概述

当前项目的日志系统主要由以下几个部分组成：
1.  **全局日志中间件 (`LoggerMiddleware`)**: 负责记录 HTTP 请求的进入和响应的完成，包括请求方法、URL、IP、User-Agent 以及响应状态码和耗时。
2.  **日志拦截器 (`LoggingInterceptor`)**: 负责记录业务处理流程中的关键信息，以及捕获并记录业务处理过程中的错误。
3.  **全局异常过滤器 (`AllExceptionsFilter`)**: 负责记录未捕获的系统异常。

## 2. 现有组件

### 2.1 日志中间件 (`src/common/middleware/logger.middleware.ts`)
- **作用范围**: 全局路由。
- **功能**:
    - 在请求到达路由处理程序之前记录请求信息（`→ METHOD URL ...`）。
    - 监听响应的 `finish` 事件，记录响应完成信息（`← METHOD URL STATUS ...`）。
    - 自动计算请求处理耗时。

### 2.2 日志拦截器 (`src/common/interceptors/logging.interceptor.ts`)
- **作用范围**: 全局拦截器。
- **功能**:
    - 使用 RxJS `tap` 操作符。
    - 在响应成功时记录日志。
    - 在发生错误时记录错误信息和耗时。

## 3. 实现功能 (本次任务)

为了满足生产环境的运维需求，我们引入了 **日志持久化** 和 **日志轮转** 机制：

1.  **日志缓存**: 将日志输出到本地文件，而非仅在控制台显示。
2.  **日志轮转**: 按天自动切割日志文件，保留最近 7 天的日志记录。
3.  **错误分离**: 将 `error` 级别的日志单独输出到 `error-%DATE%.log` 文件中，便于快速定位问题。

## 4. 技术选型

- **核心库**: `winston` (Node.js 最流行的日志库)
- **NestJS 集成**: `nest-winston`
- **文件轮转**: `winston-daily-rotate-file`

## 5. 日志文件结构

```
logs/
  application-2026-02-15.log  # 包含所有级别的日志
  application-2026-02-16.log
  error-2026-02-15.log        # 仅包含 error 级别的日志
  error-2026-02-16.log
```

## 6. 配置详情 (`src/main.ts`)

我们在 `bootstrap` 函数中替换了 NestJS 默认的 Logger：

```typescript
const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    transports: [
      // 1. 控制台输出 (带颜色和格式化)
      new winston.transports.Console({ ... }),
      
      // 2. 应用日志文件 (保留 7 天)
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '7d',
        ...
      }),
      
      // 3. 错误日志文件 (仅 error 级别, 保留 7 天)
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'error-%DATE%.log',
        level: 'error',
        ...
      }),
    ],
  }),
});
```
