# 04-DATABASE-INTEGRATION (数据库集成)

本文档详细解析了 `nestjs-be` 项目中 MongoDB 的集成方式、Schema 设计及 CRUD 操作。

## 1. 数据库配置

我们使用 `Mongoose` 作为 ORM。

### 连接设置 (`AppModule`)

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
})
```

## 2. Schema 设计

### User Schema (`src/user/schemas/user.schema.ts`)

我们定义了用户的数据结构：

```typescript
@Schema({ timestamps: true }) // 自动管理 createdAt, updatedAt
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // 存储哈希值
}

export const UserSchema = SchemaFactory.createForClass(User);
```

### Hooks (中间件)

-   **Pre-save**: 自动对密码进行 bcrypt 加密。
-   **Post-save**: 记录审计日志。

## 3. CRUD 操作 (`UserService`)

Service 层直接操作 Mongoose Model。

```typescript
constructor(@InjectModel(User.name) private userModel: Model<User>) {}

// 创建
async create(createUserDto: CreateUserDto): Promise<User> {
  const createdUser = new this.userModel(createUserDto);
  return createdUser.save(); // 触发 pre-save hook
}

// 查询所有
async findAll(): Promise<User[]> {
  return this.userModel.find().exec();
}

// 更新
async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
  // { new: true } 返回更新后的文档
  return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
}
```

## 4. 测试报告摘要

根据 [MongoDB集成测试报告](../MongoDB集成测试报告.md)：
-   ✅ MongoDB 连接成功。
-   ✅ CRUD 接口（增删改查）测试通过。
-   ✅ 唯一性约束（Email 重复）生效，触发 409 错误。
-   ✅ 自动时间戳生效。
