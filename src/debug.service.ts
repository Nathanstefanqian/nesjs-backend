import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user/schemas/user.schema';

@Injectable()
export class DebugService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async debugUser(email: string) {
    console.log(`Searching for user with email: '${email}'`);
    const user = await this.userModel.findOne({ email }).exec();
    console.log('User found:', user);
    if (user) {
      console.log('Password length:', user.password.length);
      console.log('Password bytes:', Buffer.from(user.password));
    }
    return user;
  }
}
