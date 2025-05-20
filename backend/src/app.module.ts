import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RankingModule } from './api/ranking/ranking.module';
import { PlayerMatchModule } from './api/playerMatch/playerMatch.module';
import { RefreshSessionModule } from './api/playerMatch/refresh-session.module'; // 세션 리프레시 모듈 추가
import { PingModule } from './api/ranking/ping.module'; // ping 모듈 추가

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env 환경변수 자동 로딩
    RankingModule,
    PlayerMatchModule,
    RefreshSessionModule, // 세션 리프레시 모듈 등록
    PingModule, // ping 모듈 등록
  ],
})
export class AppModule {}
