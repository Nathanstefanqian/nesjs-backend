# 开发工作日志 (Work Log)

## 日期: 2026-02-19

### 1. 认证模块 (Auth Module) 重构与优化

*   **全局认证策略**:
    *   确立了以 `JwtAuthGuard` 为核心的全局认证机制，通过 `APP_GUARD` 在 `AppModule` 中注册。
    *   默认所有接口均需登录访问，无需在每个 Controller 重复添加 `@UseGuards`。
*   **公开接口豁免**:
    *   实现了自定义 `@Public()` 装饰器，用于 `login` 和 `register` 等无需登录的接口。
    *   配合 `Reflector` 在 Guard 中动态判断路由权限。
*   **代码清理**:
    *   删除了废弃的 `auth.guard.ts` 及相关测试文件，统一使用 Passport JWT 策略。
*   **文档更新**:
    *   在 `README.md` 中补充了认证模块的开发指南，说明了 Token 使用及 Swagger 调试方法。

### 2. 用户模块 (User Module) 功能增强

*   **注册接口 (`/users/register`)**:
    *   将原有的创建用户接口重构为标准的注册流程。
    *   开放了 `@Public()` 访问权限。
    *   优化了 `CreateUserDto`，移除了 `age`、`status` 等不应由用户在注册时设定的字段。
*   **个人信息更新接口 (`/users/profile`)**:
    *   **安全性提升**: 将路由从 `/users/:id` 改为 `/users/profile`，移除了 URL 中的 ID 参数。
    *   **逻辑优化**: 强制通过 `req.user.userId` 获取当前登录用户 ID，确保**只能修改自己的信息**。
    *   **数据校验**:
        *   在 `UpdateUserDto` 中引入 `class-validator`，限制只能修改 `username` 和 `email`。
        *   增加了**邮箱唯一性检查**：修改邮箱时，自动排查是否已被其他用户占用，避免冲突。
*   **查询接口优化**:
    *   修复了 `findOne` 方法中 `id > 100` 的逻辑缺陷，确保所有合法用户 ID 均可被查询。
*   **数据模型 (Schema) 改进**:
    *   在 `UserSchema` 中配置了 `toJSON` 转换器，全局自动隐藏 `password`、`_id` 和 `__v` 敏感字段，无需在业务逻辑中手动删除。
*   **代码质量**:
    *   修复了 Mongoose `findOneAndUpdate` 的废弃参数警告 (使用 `returnDocument: 'after'`)。
    *   清理了未使用的导入和类型定义。

### 3. 待办事项

*   [ ] 补充单元测试，覆盖新的注册和更新逻辑。
*   [ ] 考虑增加修改密码的独立接口。

### 4. AI 接入 (LangChain + DeepSeek)

*   **Prompt 设计**:
    *   新增 `src/interview/prompts/resume-quiz.prompts.ts`，按简历与岗位要求输出结构化 JSON。
*   **模型工厂**:
    *   新增 `AIModelFactory`，集中管理模型初始化与参数（温度、模型名）。
*   **AIModule**:
    *   新增 `AIModule` 并在 `InterviewModule` 与 `AppModule` 中引入。
*   **简历分析 Service**:
    *   在 `InterviewService` 中实现 `analyzeResume`，通过 `PromptTemplate + RunnableSequence + JsonOutputParser` 调用模型并解析 JSON。
*   **接口接入**:
    *   新增 `POST /interview/analyze-resume`，接收 `resume_content` 和 `job_description`，返回分析结果。
*   **环境变量**:
    *   `.env.development` 已包含 `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`MAX_TOKENS` 配置项。
