import { Module } from '@nestjs/common';
import { RankingModule } from './api/ranking/ranking.module';
import { PingController } from './api/ranking/ping.controller';

@Module({
  imports: [RankingModule],
  controllers: [PingController],
})
export class AppModule {}
