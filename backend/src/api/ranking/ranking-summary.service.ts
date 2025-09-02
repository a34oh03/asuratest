// src/api/ranking/ranking-summary.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { RankingService, RankingParams } from './ranking.service';
import { getCachedBackupData } from './backup/backup-cache.util';
import { compareRankings } from './ranking.util';
import { DateTime } from 'luxon';
import { BackupService } from './backup/backup.service';
import { getSessionSecret } from '../utility/utility';

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
   * 메인 랭킹 데이터 요약
   * 1) 첫 번째 ID로 빠르게 시도
   * 2) 실패 시 기존 전체 탐색 로직으로 폴백
   */
  async getRankingSummary(userIds: string[]) {
    if (!userIds.length) {
      throw new BadRequestException('userNetIDs 파라미터가 비어 있습니다.');
    }

    // userQueue 초기화
    if (this.userQueue.length === 0) {
      this.userQueue = [...userIds];
    }

    // 1) 백업 데이터 미리 가져오기 (언제나 공통)
    const backupData = await getCachedBackupData();

    // 2) 첫 번째 ID(=우선순위 첫 번째)로 시도
    const primaryId = this.userQueue[0];
    try {
      // 솔로/트리오 데이터를 병렬로 가져옴
      let soloRaw, trioRaw, tagMatchRaw;
      try {
        [soloRaw, trioRaw, tagMatchRaw] = await Promise.all([
          this.rankingService.getRankingData(this.buildParams(primaryId, 1, 1)),
          this.rankingService.getRankingData(this.buildParams(primaryId, 2, 1)),
          this.rankingService.getRankingData(this.buildParams(primaryId, 2, 2)),
        ]);
      } catch (e) {
        // 개별 실패 시 전체 catch로 이동
        throw e;
      }
      console.log(`→ 요청 성공: ${primaryId}`);
      // 성공 시 캐시에 저장
      this.userCache = { uid: primaryId, timestamp: Date.now() / 1000 };

      // 바로 요약 생성
      return this.buildSummary(soloRaw, trioRaw, tagMatchRaw, backupData);
    } catch (e) {
      // 첫 번째 ID가 실패하면, 로깅 후 전체 탐색 로직으로 폴백
      console.warn(
        `[RankingSummaryService] primaryId(${primaryId}) 실패 → 전체 탐색 시작`,
        (e as Error).message,
      );
      return this.fullSearchAndSummary(userIds, backupData);
    }
  }

  /**
   * 전체 userIds 순차 탐색 후 최초 성공 유저로 요약 생성
   */
  private async fullSearchAndSummary(
    userIds: string[],
    backupData: ReturnType<typeof getCachedBackupData>,
  ) {
    // 1) 유효 ID 찾기 (기존 getValidUserId 로직에서 solo/trio만 추출)
    const validUid = await this.getValidUserId(userIds);

    // 2) validUid로 솔로/트리오 데이터를 병렬로 재조회
    let soloRaw, trioRaw, tagMatchRaw;
    try {
      [soloRaw, trioRaw, tagMatchRaw] = await Promise.all([
        this.rankingService.getRankingData(this.buildParams(validUid, 1, 1)),
        this.rankingService.getRankingData(this.buildParams(validUid, 2, 1)),
        this.rankingService.getRankingData(this.buildParams(validUid, 2, 2)),
      ]);
    } catch (e) {
      // 에러 발생 시 로깅 및 예외 전파
      console.error('[RankingSummaryService.fullSearchAndSummary] 데이터 병렬 조회 실패:', e);
      throw e;
    }

    // 3) 요약 생성
    return this.buildSummary(soloRaw, trioRaw, tagMatchRaw, backupData);
  }

  /**
   * 주어진 raw 데이터를 받아, API 응답용 객체로 포맷
   */
  private async buildSummary(soloRaw: any, trioRaw: any, tagMatchRaw: any, backupData: any) {
    // 1) 변화량 계산
    let soloPlayers, trioPlayers, tagMatchPlayers;
    if (backupData) {
      soloPlayers = compareRankings(backupData.solo, soloRaw.players);
      trioPlayers = compareRankings(backupData.trio, trioRaw.players);
      if (backupData.tagMatch) {
        tagMatchPlayers = compareRankings(backupData.tagMatch, tagMatchRaw.players);
      } else {
        tagMatchPlayers = tagMatchRaw.players.map((p: any) => ({
          ...p,
          rank_change: 'new',
          score_change: null,
        }));
      }
    } else {
      soloPlayers = soloRaw.players.map((p: any) => ({
        ...p,
        rank_change: 'new',
        score_change: null,
      }));
      trioPlayers = trioRaw.players.map((p: any) => ({
        ...p,
        rank_change: 'new',
        score_change: null,
      }));
    }

    // 2) 캐릭터별 1등 마킹
    for (const p of soloPlayers) {
      p.nickname = soloRaw.topPlayersByChampion[p.champion] === p.nickname
        ? `${p.nickname} 🌟`
        : p.nickname;
    }
    for (const p of trioPlayers) {
      p.nickname = trioRaw.topPlayersByChampion[p.champion] === p.nickname
        ? `${p.nickname} 🌟`
        : p.nickname;
    }
    for (const p of tagMatchPlayers) {
      p.nickname = tagMatchRaw.topPlayersByChampion[p.champion] === p.nickname
        ? `${p.nickname} 🌟`
        : p.nickname;
    }

    // 3) 최종 페이로드
    return {
      solo_players: soloPlayers,
      trio_players: trioPlayers,
      tagMatch_players: tagMatchPlayers,
      solo_stats: soloRaw.championStats,
      trio_stats: trioRaw.championStats,
      tagMatch_stats: tagMatchRaw.championStats,
      last_backup: await this.backupService.getLatestTime(),
      now_time: DateTime.now()
        .setZone('Asia/Seoul')
        .toFormat('yyyy-MM-dd HH:mm:ss'),
    };
  }

  /**
   * 기존 getValidUserId 로직에서 '솔로' 모드만 사용하도록 분리
   */
  private async getValidUserId(userIds: string[]): Promise<string> {
    const now = Date.now() / 1000;

    // 1) 캐시된 UID 우선 시도
    if (
      this.userCache.uid &&
      now - this.userCache.timestamp < CACHE_TTL
    ) {
      try {
        await this.rankingService.getRankingData(
          this.buildParams(this.userCache.uid, 1, 1),
        );
        return this.userCache.uid;
      } catch {
        this.rotateUserQueue(this.userCache.uid!);
      }
    }

    // 2) 전체 순차 탐색
    for (const id of userIds) {
      try {
        await this.rankingService.getRankingData(
          this.buildParams(id, 1, 1),
        );
        // 성공 시 캐시 & 큐 업데이트
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

  /** 요청 파라미터 구조화 */
  private buildParams(userNetID: string, teamMode: number, rankingType: number) {
    return {
      userNetID,
      sessionSecret: getSessionSecret(),
      teamMode,
      region: 'ES',
      rankingType,
      champType: 0,
      rowCount: 500,
    } as RankingParams;
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
}
