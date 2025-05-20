import { Injectable, BadRequestException } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { getCachedBackupData } from './backup/backup-cache.util';
import {
  parsePlayers,
  calculateChampionStats,
  getTopPlayersByChampion,
  compareRankings,
} from './ranking.util';
import { DateTime } from 'luxon';
import { BackupService } from './backup/backup.service';
const CACHE_TTL = 60 * 60 * 2; // 2시간

@Injectable()
export class RankingSummaryService {
  constructor(
    private readonly rankingService: RankingService,
    private readonly backupService: BackupService,
  ) {}

  // userNetID 우선순위 큐 관리
  private userQueue: string[] = [];
  private userCache: { uid: string | null; timestamp: number } = {
    uid: null,
    timestamp: 0,
  };

  /**
   * userNetID 중 유효한 ID를 찾아 반환 (캐시/순환)
   */
  private async getValidUserId(
    userIds: string[],
    teamMode: number,
  ): Promise<string> {
    const now = Date.now() / 1000;
    const { uid, timestamp } = this.userCache;

    // 1) 캐시된 UID 가 TTL 내에 유효하다면
    if (uid && now - timestamp < CACHE_TTL) {
      try {
        await this.rankingService.getRankingData({
          userNetID: uid,
          teamMode,
          region: 'ES',
          rankingType: 1,
          champType: 0,
          rowCount: 100,
        });
        return uid;
      } catch {
        this.rotateUserQueue(uid);
      }
    }
    // 2) 캐시 무효 시, 큐 순서대로 시도
    for (const id of userIds) {
      try {
        await this.rankingService.getRankingData({
          userNetID: id,
          teamMode,
          region: 'ES',
          rankingType: 1,
          champType: 0,
          rowCount: 100,
        });
        // 성공한 ID는 캐시에 저장 & 우선순위 조정
        this.userCache = { uid: id, timestamp: now };
        this.prioritizeUser(id);
        return id;
      } catch {
        this.rotateUserQueue(id);
      }
    }
    throw new BadRequestException(
      '모든 userNetID에서 데이터를 받아오지 못했습니다.',
    );
  }
  /** 큐 맨 뒤로 보내기 */
  private rotateUserQueue(userId: string) {
    const idx = this.userQueue.indexOf(userId);
    if (idx !== -1) this.userQueue.splice(idx, 1);
    this.userQueue.push(userId);
  }

  /** 큐 맨 앞으로 보내기 */
  private prioritizeUser(userId: string) {
    const idx = this.userQueue.indexOf(userId);
    if (idx !== -1) this.userQueue.splice(idx, 1);
    this.userQueue.unshift(userId);
  }

  /**
   * 메인 랭킹 데이터 요약 (솔로/트리오, 변화량, 캐릭터별 통계)
   */
  async getRankingSummary(userIds: string[]) {
    if (!userIds.length)
      throw new BadRequestException('userNetIDs 파라미터가 비어 있습니다.');
    if (!this.userQueue.length) this.userQueue = [...userIds];
    // 1. 백업 시각 및 데이터
    const backupData = await getCachedBackupData();
    // 2. 유효 userNetID 찾기
    const validUid = await this.getValidUserId(userIds, 1);
    // 3. 솔로/트리오 데이터
    const soloRaw = await this.rankingService.getRankingData({
      userNetID: validUid,
      teamMode: 1,
      region: 'ES',
      rankingType: 1,
      champType: 0,
      rowCount: 100,
    });
    const trioRaw = await this.rankingService.getRankingData({
      userNetID: validUid,
      teamMode: 2,
      region: 'ES',
      rankingType: 1,
      champType: 0,
      rowCount: 100,
    });
    const soloNow = soloRaw.players;
    const soloStats = soloRaw.championStats;
    const trioNow = trioRaw.players;
    const trioStats = trioRaw.championStats;
    // 4. 변화량 비교
    let soloPlayers, trioPlayers;
    if (backupData) {
      const soloPrev = backupData.solo;
      const trioPrev = backupData.trio;
      soloPlayers = compareRankings(soloPrev, soloNow);
      trioPlayers = compareRankings(trioPrev, trioNow);
    } else {
      soloPlayers = soloNow.map((p) => ({
        ...p,
        rank_change: 'new',
        score_change: null,
      }));
      trioPlayers = trioNow.map((p) => ({
        ...p,
        rank_change: 'new',
        score_change: null,
      }));
    }
    // 5. 캐릭터별 1등 마킹
    const soloTopChampions = soloRaw.topPlayersByChampion;
    for (const p of soloPlayers) {
      (p as any).nickname_raw = p.nickname;
      if (soloTopChampions[p.champion] === p.nickname) {
        p.nickname = `${p.nickname} 🌟`;
      }
    }
    const trioTopChampions = trioRaw.topPlayersByChampion;
    for (const p of trioPlayers) {
      (p as any).nickname_raw = p.nickname;
      if (trioTopChampions[p.champion] === p.nickname) {
        p.nickname = `${p.nickname} 🌟`;
      }
    }
    // 6. 결과 반환
    return {
      solo_players: soloPlayers,
      trio_players: trioPlayers,
      solo_stats: soloStats,
      trio_stats: trioStats,
      last_backup: await this.backupService.getLatestTime(),
      now_time: DateTime.now()
        .setZone('Asia/Seoul')
        .toFormat('yyyy-MM-dd HH:mm:ss'),
    };
  }
}
