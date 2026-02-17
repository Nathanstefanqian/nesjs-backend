# 用户登录使用指南

## 快速开始

### 1. 创建测试用户

首先需要创建一个用户用于登录测试：

```bash
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "测试用户",
  "email": "test@example.com",
  "password": "password123"
}
```

### 2. 登录获取 Token

使用创建的用户邮箱和密码登录：

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**响应示例：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiLmtYvor5XnlKjmiLciLCJpYXQiOjE3MDYxNjAwMDAsImV4cCI6MTcwNjI0NjQwMH0.xxx",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "name": "测试用户"
  }
}
```

### 3. 在 Swagger 中使用

#### 方式一：自动授权（推荐）
1. 访问 Swagger 文档：`http://localhost:3000/api`
2. 找到 `auth` 标签下的 `POST /auth/login` 接口
3. 点击 "Try it out"
4. 输入邮箱和密码
5. 点击 "Execute"
6. **登录成功后，Token 会自动填充到 Authorize 中！**

#### 方式二：手动授权
1. 复制登录响应中的 `access_token`
2. 点击页面右上角的 🔓 **Authorize** 按钮
3. 在弹出的对话框中粘贴 token（不需要加 "Bearer " 前缀）
4. 点击 "Authorize"
5. 点击 "Close"

### 4. 测试受保护的接口

授权后，可以测试需要认证的接口：

```bash
GET http://localhost:3000/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

或者在 Swagger 中直接点击 "Try it out" 测试任何接口。

## API 接口说明

### 登录接口
- **路径**: `POST /auth/login`
- **权限**: 公开（不需要 token）
- **请求体**:
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **响应**: 返回 JWT token 和用户信息

### 获取用户信息
- **路径**: `GET /auth/profile`
- **权限**: 需要 JWT token
- **响应**: 返回当前登录用户的信息

### 创建用户
- **路径**: `POST /users`
- **权限**: 需要 JWT token
- **请求体**:
  ```json
  {
    "name": "用户名",
    "email": "user@example.com",
    "password": "password123"
  }
  ```

## 注意事项

⚠️ **重要提示**：
1. 当前密码是明文存储，仅用于开发测试
2. 生产环境必须使用 bcrypt 等加密算法加密密码
3. Token 有效期为 24 小时
4. 除了 `/auth/login` 和 `/test` 接口，其他接口都需要 JWT 认证

## 常见问题

### Q: 登录后如何使用 token？
A: 在 Swagger 右上角点击 Authorize 按钮，输入 token 即可。

### Q: Token 过期了怎么办？
A: 重新调用登录接口获取新的 token。

### Q: 忘记密码怎么办？
A: 当前版本没有找回密码功能，可以直接在数据库中修改或重新创建用户。

### Q: 如何退出登录？
A: JWT 是无状态的，客户端删除 token 即可。在 Swagger 中点击 Authorize 按钮，然后点击 Logout。

