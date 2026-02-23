import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GomokuGateway } from './gomoku/gomoku.gateway';
import { GomokuService } from './gomoku/gomoku.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GameRecord, GameRecordSchema } from './schemas/game-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameRecord.name, schema: GameRecordSchema },
    ]),
  ],
  providers: [GomokuGateway, GomokuService, JwtService, ConfigService],
  exports: [GomokuService],
})
export class GameModule {}
