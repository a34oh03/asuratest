// src/ranking/ranking.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { parsePlayers, calculateChampionStats, getTopPlayersByChampion, compareRankings, shouldBackupBasedOnTime } from './ranking.util';

export interface RankingParams {
  userNetID:   string;
  region:      string;
  rankingType: number;
  champType:   number;
  teamMode:    number;
  rowCount:    number;
}

@Injectable()
export class RankingService {
  constructor(private readonly httpService: HttpService) {}

  async getRankingData(params: RankingParams): Promise<any> {
    const API_URL = 'http://live.surajang.com:6557/ranking/getTopRankN';

    // Observable → Promise
    const response$: Promise<AxiosResponse> = firstValueFrom(
      this.httpService.get(API_URL, { params }).pipe(
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
    const playersRaw = data?.players ?? [];
    const players = parsePlayers(playersRaw);
    const championStats = calculateChampionStats(playersRaw);
    const topPlayersByChampion = getTopPlayersByChampion(players);
    // compareRankings, shouldBackupBasedOnTime 등도 필요시 활용 가능

    return {
      ...data,
      players, // 가공된 플레이어 리스트
      championStats, // 캐릭터별 통계
      topPlayersByChampion, // 캐릭터별 최고 점수 플레이어
    };
  }
}
