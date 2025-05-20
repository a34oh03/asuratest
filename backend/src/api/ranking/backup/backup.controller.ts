import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { BackupService } from './backup.service';
import { RankingService } from '../ranking.service';
import { shouldBackupBasedOnTime } from '../ranking.util';

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
  async triggerBackup() {
    // 1. 환경변수에서 userNetID 배열 가져오기 (USER_LIST)
    function getUserList(): string[] {
      try {
        const raw = process.env.USER_LIST;
        if (!raw) {
          console.error('USER_LIST 환경변수 미설정 (backup.controller.ts)');
          throw new BadRequestException('USER_LIST 환경변수 미설정');
        }
        return raw.split(',').map(x => x.trim()).filter(Boolean);
      } catch (e) {
        console.error('USER_LIST 파싱 예외:', e);
        throw e;
      }
    }
    const userIds = getUserList();
    const lastBackup = await this.backupService.getLatestTime();
    if (!shouldBackupBasedOnTime(lastBackup || '')) {
      return { status: 'SKIP', lastBackup };
    }
    // 2. userIds 순회하며 성공 ID 찾기 (ranking-summary.service.ts 방식)
    let validUid = '';
    for (const uid of userIds) {
      try {
        await this.rankingService.getRankingData({
          userNetID: uid,
          teamMode: 1,
          region: 'ES',
          rankingType: 1,
          champType: 0,
          rowCount: 100,
        });
        validUid = uid;
        break; // 성공 시 중단
      } catch (e) {
        // 실패 시 로깅 및 다음 ID 시도
        console.error(`[backup.controller] userNetID ${uid} 실패:`, e?.message || e);
      }
    }
    if (!validUid) {
      throw new BadRequestException('모든 userNetID로 랭킹 데이터 조회 실패');
    }
    // 3. 성공한 validUid로 solo/trio 데이터 백업
    const soloData = await this.rankingService.getRankingData({
      userNetID: validUid,
      teamMode: 1,
      region: 'ES',
      rankingType: 1,
      champType: 0,
      rowCount: 100,
    });
    const trioData = await this.rankingService.getRankingData({
      userNetID: validUid,
      teamMode: 2,
      region: 'ES',
      rankingType: 1,
      champType: 0,
      rowCount: 100,
    });
    const backupObj = { solo: soloData.players, trio: trioData.players };
    const fs = await import('fs/promises');
    const backupPath = 'ranking_backup.json';
    await fs.writeFile(backupPath, JSON.stringify(backupObj, null, 2), {
      encoding: 'utf-8',
    });
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
