import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt: ${loginDto.email}`);
    // 查找用户
    const user = await this.userModel.findOne({ email: loginDto.email }).exec();
    this.logger.log(`User found: ${user ? 'Yes' : 'No'}`);

    if (!user) {
      this.logger.warn('User not found in DB');
      throw new UnauthorizedException('没找到这个用户呢宝宝');
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      this.logger.warn('Password mismatch');
      throw new UnauthorizedException('密码错误呢宝宝');
    }

    // 生成 JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 86400, // 24小时
      user: {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userModel.findOne({ id: userId }).exec();
  }
}
