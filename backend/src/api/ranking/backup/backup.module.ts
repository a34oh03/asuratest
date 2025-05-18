// src/backup/backup.module.ts
import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { RankingService } from '../ranking.service';
import { forwardRef } from '@nestjs/common';
import { RankingModule } from '../ranking.module';

@Module({
  imports: [forwardRef(() => RankingModule)],
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
