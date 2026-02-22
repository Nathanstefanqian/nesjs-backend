
import { Module } from '@nestjs/common';
import { WatchPartyGateway } from './watch-party.gateway';
import { WatchPartyService } from './watch-party.service';
import { WatchPartyController } from './watch-party.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WatchPartyController],
  providers: [WatchPartyGateway, WatchPartyService],
})
export class WatchPartyModule {}
