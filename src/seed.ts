import { NestFactory } from '@nestjs/core';
import { ConflictException } from '@nestjs/common';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';
import { CreateUserDto } from './user/dto/create-user.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userService = app.get(UserService);
    const userDto: CreateUserDto = {
      username: 'fungleo',
      email: 'fungleo@example.com',
      password: 'Password123!',
    };

    try {
      const user = await userService.register(userDto);
      console.log('User created successfully:', user);
    } catch (error) {
      // Check for duplicate key error (11000) or ConflictException
      if (
        error instanceof ConflictException ||
        error.code === 11000 ||
        (error.message && error.message.includes('Conflict'))
      ) {
        console.log('User already exists, skipping creation.');
      } else {
        console.error('Error creating user:', error);
      }
    }
  } catch (error) {
    console.error('Error in seed script:', error);
  } finally {
    await app.close();
  }
}
bootstrap();
