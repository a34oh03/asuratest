import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { BackupService } from './backup.service';
import { RankingService } from '../ranking/ranking.service';
import { shouldBackupBasedOnTime } from '../ranking/ranking.util';

@Controller('api/backup')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly rankingService: RankingService,
  ) {}

  /**
   * 오늘 이미 백업했으면 SKIP, 아니면 즉시 백업
   * GET /api/backup/trigger?userNetIDs=aaa,bbb,ccc
   */
  @Get('trigger')
  async triggerBackup(@Query('userNetIDs') userNetIDs?: string) {
    const userIds = userNetIDs ? userNetIDs.split(',').filter(Boolean) : [];
    const lastBackup = await this.backupService.getLatestTime();
    if (!shouldBackupBasedOnTime(lastBackup || '')) {
      return { status: 'SKIP', lastBackup };
    }
    // 유효 userNetID로 랭킹 데이터 조회
    if (!userIds.length) throw new BadRequestException('userNetIDs 파라미터가 필요합니다.');
    const validUid = userIds[0]; // (간단화, 상세 로직은 summary 참고)
    const soloData = await this.rankingService.getRankingData({ userNetID: validUid, teamMode: 1, region: 'ES', rankingType: 1, champType: 0, rowCount: 100 });
    const trioData = await this.rankingService.getRankingData({ userNetID: validUid, teamMode: 2, region: 'ES', rankingType: 1, champType: 0, rowCount: 100 });
    const backupObj = { solo: soloData.players, trio: trioData.players };
    const fs = await import('fs/promises');
    const backupPath = 'ranking_backup.json';
    await fs.writeFile(backupPath, JSON.stringify(backupObj, null, 2), { encoding: 'utf-8' });
    // luxon으로 오늘 날짜 (KST)로 파일명 생성
    const { DateTime } = await import('luxon');
    const nowStr = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd');
    const remotePath = `backups/rank_${nowStr}.json`;
    await this.backupService.upload(backupPath, remotePath);
    await this.backupService.setLatestTime();
    return { status: 'OK', backup: remotePath };
  }

  /**
   * GET /api/backup/cached : 캐시된 백업 데이터 반환
   */
  @Get('cached')
  async getCachedBackup() {
    return this.backupService.getCached();
  }
}
