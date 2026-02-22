import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, CallbackError } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = HydratedDocument<User> & {
  comparePassword: (password: string) => Promise<boolean>;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Number, unique: true })
  id: number;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  age: number;

  @Prop()
  avatar: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 转换输出，隐藏密码和内部字段
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    delete ret.password;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// 添加钩子：保存前加密密码
UserSchema.pre('save', async function () {
  const user = this as unknown as UserDocument;

  // 如果密码没有被修改，就不用重新加密
  if (!user.isModified('password')) {
    return;
  }

  // 生成盐
  const salt = await bcrypt.genSalt(10);
  // 用盐加密密码
  user.password = await bcrypt.hash(user.password, salt);
});

// 添加钩子：保存后，打印日志
UserSchema.post(
  'save',
  function (doc: UserDocument, next: (err?: CallbackError) => void) {
    console.log(`用户 ${doc.username} 已保存`);
    next();
  },
);

// 添加方法：比对密码
UserSchema.methods.comparePassword = async function (password: string) {
  const user = this as UserDocument;
  return bcrypt.compare(password, user.password);
};
