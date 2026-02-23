import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';
import { CreateUserDto } from './user/dto/create-user.dto';
import { User, UserDocument } from './user/schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userService = app.get(UserService);
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    const userDto: CreateUserDto = {
      username: 'fungleo',
      email: 'fungleo@example.com',
      password: 'Password123!',
    };

    let user = await userModel.findOne({ username: userDto.username });

    if (!user) {
      try {
        await userService.register(userDto);
        user = await userModel.findOne({ username: userDto.username });
        console.log('User created successfully:', user?.username);
      } catch (error) {
        console.error('Error creating user:', error);
      }
    } else {
      console.log('User already exists:', user.username);
    }

    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('User role updated to admin:', user.role);
    }

    // Create admin@lumi.com
    const adminDto: CreateUserDto = {
      username: 'admin',
      email: 'admin@lumi.com',
      password: 'Password123!',
    };

    let admin = await userModel.findOne({ email: adminDto.email });

    if (!admin) {
      try {
        await userService.register(adminDto);
        admin = await userModel.findOne({ email: adminDto.email });
        console.log('Admin user created successfully:', admin?.username);
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
    } else {
      console.log('Admin user already exists:', admin.username);
    }

    if (admin) {
      admin.role = 'admin';
      await admin.save();
      console.log('Admin user role updated to admin:', admin.role);
    }
  } catch (error) {
    console.error('Error in seed script:', error);
  } finally {
    await app.close();
  }
}
bootstrap();
