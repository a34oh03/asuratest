// src/ranking/ranking.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  parsePlayers,
  calculateChampionStats,
  getTopPlayersByChampion,
  compareRankings,
  shouldBackupBasedOnTime,
} from './ranking.util';

export interface RankingParams {
  userNetID: string;
  region: string;
  rankingType: number;
  champType: number;
  teamMode: number;
  rowCount: number;
}

/**
 * 외부 랭킹 API 호출 및 결과 가공 서비스
 */
@Injectable()
export class RankingService {
  constructor(private readonly httpService: HttpService) {}

  async getRankingData(params: RankingParams): Promise<{
    // 최종적으로 반환할 가공된 데이터 타입 정의
    players: Array<{ nickname: string; score: number; champion: number }>;
    championStats: { labels: string[]; counts: number[] };
    topPlayersByChampion: Record<number, string>;
  }> {
    const API_URL = 'http://live.surajang.com:6557/ranking/getTopRankN';
    const queryString = new URLSearchParams({
      userNetID: params.userNetID,
      region: params.region,
      rankingType: params.rankingType.toString(),
      champType: params.champType.toString(),
      teamMode: params.teamMode.toString(),
      rowCount: params.rowCount.toString(),
    }).toString();
    // 2) 최종 호출할 URL
    const fullUrl = `${API_URL}?${queryString}`;

    // 3) 로깅
    console.log(`→ HTTP GET: ${fullUrl}`);

    // 5) HTTP GET 요청: Observable → Promise
    const response$: Promise<AxiosResponse> = firstValueFrom(
      this.httpService.get(fullUrl).pipe(
        catchError((error) => {
          // 외부 API 에러 시 NestJS HttpException으로 변환
          throw new HttpException(
            `랭킹 조회 서버 오류: ${error.message}`,
            HttpStatus.BAD_GATEWAY,
          );
        }),
      ),
    );

    const { data } = await response$;

    // playersRaw 예시: [nickname, score, champId, ...] 반복
    const rawPlayers: any[] = data?.data?.players ?? [];

    const players = parsePlayers(rawPlayers);
    const championStats = calculateChampionStats(rawPlayers);
    const topPlayersByChampion = getTopPlayersByChampion(players);
    // compareRankings, shouldBackupBasedOnTime 등도 필요시 활용 가능

    return {
      players, // 가공된 플레이어 리스트
      championStats, // 캐릭터별 통계
      topPlayersByChampion, // 캐릭터별 최고 점수 플레이어
    };
  }
}
