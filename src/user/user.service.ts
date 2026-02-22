import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  // 获取下一个自增 ID 私有方法
  private async getNextSequence(name: string): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    return counter.seq;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findOne({ id }).exec();
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return user;
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    try {
      const id = await this.getNextSequence('user_id');
      const createdUser = new this.userModel({ ...createUserDto, id });
      return await createdUser.save();
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB 唯一性约束错误
        const field = Object.keys(error.keyPattern as Record<string, any>)[0];
        throw new ConflictException(
          `${field} 已存在，请使用其他${field === 'email' ? '邮箱' : field}`,
        );
      }
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // 如果更新邮箱，检查邮箱是否已被使用
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        id: { $ne: id }, // 排除当前用户
      });
      if (existingUser) {
        throw new BadRequestException('邮箱已被使用');
      }
    }

    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate({ id }, updateUserDto, { returnDocument: 'after' })
        .exec();
      if (!updatedUser) {
        throw new NotFoundException(`用户 ID ${id} 不存在`);
      }
      return updatedUser;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB 唯一性约束错误
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(
          `${field} 已存在，请使用其他${field === 'email' ? '邮箱' : field}`,
        );
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const result = await this.userModel.findOneAndDelete({ id }).exec();
    if (!result) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
  }

  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { id },
        { avatar: avatarUrl },
        { returnDocument: 'after' },
      )
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return updatedUser;
  }
}
