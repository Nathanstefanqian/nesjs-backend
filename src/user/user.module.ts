import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController, testController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    CommonModule,
  ],
  providers: [UserService],
  controllers: [UserController, testController],
  exports: [UserService],
})
export class UserModule {}
