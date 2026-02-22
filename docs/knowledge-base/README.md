# NestJS Backend 知识库 (Knowledge Base)

本文档旨在全面解析 `nestjs-be` 后端项目的架构设计、核心模块实现及开发规范。

## 📚 目录

### 1. 认证与安全 (Authentication & Security)
- [01-AUTH-MODULE.md](01-AUTH-MODULE.md)
  - Auth 模块架构设计
  - JWT 认证流程与全局守卫
  - 密码加密与安全比对 (`bcryptjs`)
  - 登录接口使用指南

### 2. 异常处理 (Error Handling)
- [02-EXCEPTION-HANDLING.md](02-EXCEPTION-HANDLING.md)
  - 异常过滤器层级设计
  - 全局异常过滤器 (`AllExceptionsFilter`)
  - MongoDB 错误处理 (`MongoExceptionFilter`)
  - 统一错误响应格式规范

### 3. 日志系统 (Logging System)
- [03-LOGGING-SYSTEM.md](03-LOGGING-SYSTEM.md)
  - Winston 日志库集成
  - 日志中间件与拦截器
  - 日志持久化与轮转策略
  - 错误日志分离

### 4. 数据库集成 (Database Integration)
- [04-DATABASE-INTEGRATION.md](04-DATABASE-INTEGRATION.md)
  - Mongoose 模块配置
  - User Schema 设计与 Hooks
  - CRUD 操作实现与测试
  - 数据库连接状态监控

### 5. 核心概念与杂项 (Core Concepts & Misc)
- [05-CORE-CONCEPTS.md](05-CORE-CONCEPTS.md)
  - 配置管理 (Config) 原理
  - SSE (Server-Sent Events) 实现方案对比
  - Promise vs Observable
  - Koa vs NestJS 架构对比

---

## 🚀 学习路径建议

1.  **入门**: 阅读 **05-CORE-CONCEPTS.md** 了解 NestJS 的核心设计理念。
2.  **核心**: 深入 **01-AUTH-MODULE.md** 掌握用户认证机制。
3.  **基建**: 学习 **02-EXCEPTION-HANDLING.md** 和 **03-LOGGING-SYSTEM.md** 理解系统的稳健性保障。
4.  **实战**: 参考 **04-DATABASE-INTEGRATION.md** 进行业务开发。
