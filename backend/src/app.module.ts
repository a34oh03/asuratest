import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RankingModule } from './api/ranking/ranking.module';
import { PlayerMatchModule } from './api/playerMatch/playerMatch.module';
import { PingController } from './api/ranking/ping.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env 환경변수 자동 로딩
    RankingModule,
    PlayerMatchModule,
  ],
  controllers: [PingController],
})
export class AppModule {}
