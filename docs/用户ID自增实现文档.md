# 用户 ID 自增功能实现文档

## 修改概述

将用户 ID 从 MongoDB 的 ObjectId（24位十六进制字符串）改为从 1 开始的自增整数。

## 实现方案

### 1. 创建计数器 Schema

**文件**: `src/user/schemas/counter.schema.ts`

```typescript
@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  name: string;  // 计数器名称，如 'user_id'

  @Prop({ required: true, default: 0 })
  seq: number;   // 当前序列号
}
```

**作用**: 存储各种实体的自增计数器

### 2. 修改 User Schema

**文件**: `src/user/schemas/user.schema.ts`

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ type: Number, unique: true })
  id: number;  // 新增：自定义的自增 ID

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;
}
```

**变化**:
- 添加 `id` 字段（Number 类型）
- MongoDB 的 `_id` 仍然存在，但不再作为主要标识

### 3. 更新 User Service

**核心方法**: `getNextSequence()`

```typescript
private async getNextSequence(name: string): Promise<number> {
  const counter = await this.counterModel.findOneAndUpdate(
    { name },                    // 查找条件
    { $inc: { seq: 1 } },       // 原子性递增
    { new: true, upsert: true }, // 返回新值，不存在则创建
  );
  return counter.seq;
}
```

**工作原理**:
1. 查找名为 `user_id` 的计数器
2. 将 `seq` 字段原子性递增 1
3. 如果计数器不存在，自动创建（从 1 开始）
4. 返回新的序列号

**修改的方法**:

```typescript
// 创建用户
async create(createUserDto: CreateUserDto): Promise<User> {
  const id = await this.getNextSequence('user_id');  // 获取新 ID
  const createdUser = new this.userModel({ ...createUserDto, id });
  return await createdUser.save();
}

// 查询用户
async findOne(id: number): Promise<User> {
  return this.userModel.findOne({ id }).exec();  // 使用 id 而非 _id
}

// 更新用户
async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
  return this.userModel.findOneAndUpdate({ id }, updateUserDto, { new: true }).exec();
}

// 删除用户
async delete(id: number): Promise<void> {
  await this.userModel.findOneAndDelete({ id }).exec();
}
```

### 4. 更新 Controller

**参数类型变化**:

```typescript
// 之前：string 类型 + ObjectId 验证
async findOne(@Param('id') id: string): Promise<User>

// 现在：number 类型 + ParseIntPipe 自动转换
async findOne(@Param('id', ParseIntPipe) id: number): Promise<User>
```

**ParseIntPipe 的作用**:
- 自动将字符串参数转换为数字
- 如果转换失败（如 `abc`），自动返回 400 错误
- 无需手动验证

## 数据结构对比

### 修改前（ObjectId）

```json
{
  "_id": "698ef1f25049fb8e451efb3f",
  "name": "张三",
  "email": "zhangsan@example.com",
  "createdAt": "2026-02-13T09:42:10.240Z",
  "updatedAt": "2026-02-13T09:42:10.240Z"
}
```

### 修改后（自增 ID）

```json
{
  "_id": "699043179249ed5f2efeedeb",
  "id": 1,
  "name": "用户1",
  "email": "user1@example.com",
  "createdAt": "2026-02-14T09:40:39.380Z",
  "updatedAt": "2026-02-14T09:40:39.380Z"
}
```

**注意**: `_id` 仍然存在（MongoDB 必需），但 `id` 才是业务主键

## API 使用示例

### 创建用户（自动分配 ID）

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"用户1","email":"user1@example.com"}'

# 响应
{
  "id": 1,
  "name": "用户1",
  "email": "user1@example.com",
  ...
}
```

### 获取用户（使用数字 ID）

```bash
curl http://localhost:3000/users/1

# 响应
{
  "id": 1,
  "name": "用户1",
  ...
}
```

### 更新用户

```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"更新后的用户1"}'
```

### 删除用户

```bash
curl -X DELETE http://localhost:3000/users/1
```

### 错误处理

```bash
# 无效的 ID 格式
curl http://localhost:3000/users/abc

# 响应 400
{
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request",
  "statusCode": 400
}

# 不存在的 ID
curl http://localhost:3000/users/999

# 响应 404
{
  "message": "用户 ID 999 不存在",
  "error": "Not Found",
  "statusCode": 404
}
```

## 测试结果

| 操作 | URL | ID | 结果 |
|------|-----|-----|------|
| 创建用户1 | POST /users | - | ✅ id=1 |
| 创建用户2 | POST /users | - | ✅ id=2 |
| 创建用户3 | POST /users | - | ✅ id=3 |
| 获取用户 | GET /users/1 | 1 | ✅ 返回用户1 |
| 获取用户 | GET /users/2 | 2 | ✅ 返回用户2 |
| 更新用户 | PUT /users/1 | 1 | ✅ 更新成功 |
| 删除用户 | DELETE /users/3 | 3 | ✅ 删除成功 |
| 无效ID | GET /users/abc | abc | ✅ 400 错误 |
| 不存在ID | GET /users/999 | 999 | ✅ 404 错误 |

## 优势

### 1. 用户友好
- ID 简短易记（1, 2, 3 vs 698ef1f25049fb8e451efb3f）
- 便于调试和测试
- URL 更简洁

### 2. 性能优化
- 数字索引比字符串索引更快
- 占用空间更小（4字节 vs 12字节）

### 3. 业务需求
- 符合传统数据库习惯
- 便于与其他系统集成
- 支持顺序查询（如获取最新的10个用户）

## 注意事项

### 1. 并发安全
使用 MongoDB 的原子操作 `$inc` 确保并发环境下 ID 不会重复：

```typescript
{ $inc: { seq: 1 } }  // 原子性递增，线程安全
```

### 2. ID 不可重用
删除用户后，其 ID 不会被重新分配。例如：
- 创建用户1（id=1）
- 创建用户2（id=2）
- 删除用户1
- 创建用户3（id=3，而不是1）

### 3. 数据迁移
如果已有使用 ObjectId 的数据，需要：
1. 备份数据库
2. 清空 users 集合
3. 重新导入数据（会自动分配新 ID）

### 4. 扩展性
如果需要为其他实体（如 Product、Order）也使用自增 ID：

```typescript
// 产品 ID
const productId = await this.getNextSequence('product_id');

// 订单 ID
const orderId = await this.getNextSequence('order_id');
```

每个实体使用独立的计数器，互不影响。

## 总结

通过引入 Counter Schema 和自增逻辑，成功将用户 ID 从 MongoDB 的 ObjectId 改为从 1 开始的自增整数，提升了 API 的易用性和性能。

**核心改动**:
- ✅ 创建 Counter Schema
- ✅ User Schema 添加 id 字段
- ✅ Service 实现自增逻辑
- ✅ Controller 参数类型改为 number
- ✅ 完善错误处理

**测试状态**: 全部通过 ✅

