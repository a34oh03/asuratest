import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RankingController } from './api/ranking/ranking.controller';
import { RankingService } from './api/ranking/ranking.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController, RankingController],
  providers: [AppService, RankingService],
})
export class AppModule {}
