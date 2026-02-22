import { Module } from '@nestjs/common';
import { GomokuGateway } from './gomoku/gomoku.gateway';
import { GomokuService } from './gomoku/gomoku.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [GomokuGateway, GomokuService, JwtService, ConfigService],
})
export class GameModule {}
