# 05-CORE-CONCEPTS (核心概念与杂项)

本文档汇总了 `nestjs-be` 项目中涉及的一些核心设计理念和技术选型对比。

## 1. 配置管理 (Config)

### 原理
遵循 **Twelve-Factor App** 原则，将配置与代码分离。

### 实现步骤
1.  **文件**: `.env.development` 存储敏感信息（API Key, DB URI）。
2.  **校验**: `config.schema.ts` 使用 Joi 验证配置项是否存在且格式正确（Fail Fast）。
3.  **注入**: `ConfigService` 将配置注入到需要的模块中。

## 2. SSE vs WebSocket

在实时通信场景下，我们选择了 SSE (Server-Sent Events) 用于简单的单向推送（如 AI 对话流）。

| 特性 | SSE | WebSocket |
| :--- | :--- | :--- |
| **方向** | 单向 (Server -> Client) | 双向 (Full Duplex) |
| **协议** | HTTP | TCP |
| **重连** | 自动 | 需要手动实现 |
| **场景** | AI 打字机效果、股票行情 | 在线游戏、聊天室 |

### 实现细节
NestJS 中可以使用 `Observable` (RxJS) 或 `Async Generator` (Promise) 实现 SSE。本项目推荐使用 **Async Generator**，因为它的语法更接近同步代码，易于理解。

```typescript
@Sse('stream')
async *sse(): AsyncGenerator {
  yield { data: { msg: 'Hello' } };
  await sleep(1000);
  yield { data: { msg: 'World' } };
}
```

## 3. 架构对比: Koa vs NestJS

| 维度 | Koa | NestJS |
| :--- | :--- | :--- |
| **风格** | 极简、微内核 | 电池全含 (Batteries included) |
| **架构** | 自由发挥，易写出面条代码 | 模块化 (Module, Controller, Service) |
| **TS 支持** | 需要额外配置 | 原生完美支持 |
| **适用** | 小型服务、极客项目 | 企业级大型应用、团队协作 |

NestJS 的 **依赖注入 (DI)** 和 **装饰器 (Decorators)** 是其核心优势，虽然学习曲线陡峭，但能显著提高代码的可维护性和可测试性。
