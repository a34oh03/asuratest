import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { RankingSummaryController } from './ranking-summary.controller';
import { RankingSummaryService } from './ranking-summary.service';
import { forwardRef } from '@nestjs/common';
import { BackupModule } from '../backup/backup.module';

@Module({
  imports: [HttpModule, forwardRef(() => BackupModule)],
  controllers: [RankingController, RankingSummaryController],
  providers: [RankingService, RankingSummaryService],
  exports: [RankingService],
})
export class RankingModule {}
