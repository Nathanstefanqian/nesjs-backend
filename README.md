# Demo API

NestJS 项目，集成了 Swagger API 文档。

## 安装依赖

首先需要安装 Swagger 依赖：

```bash
pnpm add @nestjs/swagger
# 或
npm install @nestjs/swagger
```

## 运行项目

```bash
# 开发模式
pnpm start:dev

# 调试模式
pnpm start:debug
```

## Swagger 文档

项目启动后会自动打开 Swagger 文档页面：

- 应用地址: http://localhost:3000
- Swagger 文档: http://localhost:3000/api

## API 端点

### 用户管理 (Users)

- `GET /users` - 获取所有用户
- `GET /users/:id` - 根据 ID 获取用户
- `POST /users` - 创建新用户

## 如何添加新的 API 文档

在 Controller 中使用 Swagger 装饰器：

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')  // API 分组标签
@Controller('users')
export class UserController {
  
  @Get()
  @ApiOperation({ summary: '获取所有用户' })  // 接口描述
  @ApiResponse({ status: 200, description: '成功' })  // 响应说明
  findAll() {
    // ...
  }
}
```

使用 DTO 类定义请求体：

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名称', example: '张三' })
  name: string;

  @ApiProperty({ description: '用户邮箱', example: 'zhangsan@example.com' })
  email: string;
}
```

这样 Swagger 会自动生成完整的 API 文档！
