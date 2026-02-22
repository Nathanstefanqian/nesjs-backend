# LumiChat Backend (NestJS)

LumiChat 后端服务基于 NestJS 框架构建，为前端提供强大的 RESTful API 和实时 WebSocket 通信支持。本项目采用模块化架构，集成了 MongoDB、JWT 鉴权、文件存储和 AI 模型接口。

## 🚀 产品更新日志 (v0.5.0)

本次更新大幅扩展了系统的功能边界，新增了 **协同观影**、**视频企划** 和 **实时通讯** 三大核心模块，并对基础架构进行了深度优化。

### ✨ 新增模块

#### 1. 🎬 协同观影模块 (Watch Party Module)
- **WebSocket 协同**：实现了 `WatchPartyGateway`，支持多用户房间内的视频播放状态（播放/暂停/进度）毫秒级同步。
- **视频托管**：
  - 集成了大文件上传接口，支持 MP4 等常见格式。
  - 配置了静态资源服务 (`ServeStaticModule`)，确保视频流的高效分发。
  - 实现了基于房间的广播机制，确保操作仅在当前放映室生效。

#### 2. 📋 视频企划模块 (Video Task Module)
- **任务管理**：提供视频制作任务的 CRUD 接口，支持状态流转和优先级管理。
- **AI 生成**：对接 AI 服务，支持根据简短描述自动生成详细的视频拍摄脚本和分镜方案。

#### 3. 💬 实时通讯模块 (Chat Module)
- **即时消息**：基于 Socket.IO 实现私信发送与接收，支持离线消息存储。
- **好友关系**：新增 Friend 模块，处理好友申请、接受、拒绝及列表查询。
- **会话管理**：支持创建群聊（多对多）和私聊（一对一），自动维护会话最后一条消息状态。

#### 4. 🤖 AI 对话模块 (AI Module)
- **流式响应**：实现了 Server-Sent Events (SSE) 接口，支持 AI 回复的打字机效果。
- **上下文管理**：自动检索并注入历史对话记录，保持对话连贯性。

### 🛠 架构优化

- **全局异常处理**：引入 `AllExceptionsFilter`，统一捕获并格式化 HTTP 和 WebSocket 异常，提供标准化的错误响应。
- **日志系统**：集成全局日志拦截器，记录关键操作的请求参数与响应时间，便于排查性能瓶颈。
- **文档支持**：集成了 Swagger UI，自动生成最新的 API 接口文档。

---

## 🚧 开发挑战与解决方案

在后端开发过程中，我们重点攻克了以下技术难点：

### 1. WebSocket 多命名空间管理
- **问题**：随着功能增加，单一 WebSocket 网关难以维护，且不同模块（聊天、观影）的消息容易混淆。
- **解决**：
  - 采用模块化网关设计，分离 `ChatGateway` (默认命名空间) 和 `WatchPartyGateway` (`/watch-party`)。
  - 利用 Socket.IO 的 `Namespace` 和 `Room` 机制，实现消息的精准路由和隔离。

### 2. 大文件上传与静态资源服务
- **问题**：默认配置下，NestJS 对请求体大小有限制，导致视频上传失败；且静态资源跨域访问受限。
- **解决**：
  - 调整 `main.ts` 中的 `bodyParser` 配置，放宽 JSON 和 URL-encoded 数据的大小限制至 50MB+。
  - 配置 `ServeStaticModule` 时显式开启 CORS 支持，并设置合理的缓存策略，确保前端能流畅加载视频。

### 3. 数据一致性与完整性
- **问题**：在处理好友请求和会话创建时，涉及多张表（User, FriendRequest, Conversation）的原子操作。
- **解决**：
  - 优化 Mongoose Schema 设计，利用 populate 进行关联查询。
  - 在关键业务逻辑中（如接受好友请求自动创建会话）加强了事务性检查，防止数据孤岛。

### 4. WebSocket 鉴权
- **问题**：标准的 HTTP Guard 无法直接应用于 WebSocket 连接，导致未授权用户可能连接到服务器。
- **解决**：
  - 在 `handleConnection` 钩子中手动解析握手请求中的 JWT Token。
  - 封装统一的 Socket 鉴权中间件，确保只有持有有效 Token 的用户才能建立连接。

---

## 📦 快速开始

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置环境变量**
   复制 `.env.example` 为 `.env.development` 并填入配置：
   ```env
   MONGO_URI=mongodb://localhost:27017/lumichat
   JWT_SECRET=your_secret_key
   ```

3. **启动开发服务器**
   ```bash
   pnpm start:dev
   ```

4. **访问 API 文档**
   启动后访问：`http://localhost:3000/api`
