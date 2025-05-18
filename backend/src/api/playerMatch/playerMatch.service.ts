import { Injectable, Logger, HttpException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ViewMatchStatsDto } from './dto/view-match-stats.dto';
import { ViewMatchRecordDto } from './dto/view-match-record.dto';
import {
  CHAMP_NAMES, MMR_LABELS, REGION_LABELS, ITEM_NAMES, PLAY_MAP, TEAM_MAP
} from './constants/playerMatch.constants';
import { fmtNum, avgPercent, formatElapsed, formatPlayTime } from './util/asurajang.util';
import { formatAggregateStatsBlock, formatSingleMatchRecord, getMostPlayedChampionType, summarizeRecentMatches, summarizeRecentMatchesByChampion } from './playerMatch.format';

@Injectable()
export class PlayerMatchService {
  private readonly BASE_URL = 'http://live.surajang.com:6557';
  private readonly logger = new Logger(PlayerMatchService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * 솔로/트리오 통계 조회
   * @param userNetID
   * @param sessionSecret
   * @param dto
   */
  async viewMatchStats(userNetID: string, sessionSecret: string, dto: ViewMatchStatsDto): Promise<any> {
    try {
      const resp = await this.httpService.axiosRef.get(`${this.BASE_URL}/user/viewMatchStats`, {
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'deflate, gzip',
          'Connection': 'Keep-Alive',
          'User-Agent': 'X-UnrealEngine-Agent',
        },
        params: {
          userNetID,
          sessionSecret,
          viewNickname: dto.viewNickname,
          region: dto.region || 'ES',
        },
        timeout: 5000,
      });
      const data = resp.data?.data || {};
      // 닉네임이 없거나 잘못된 경우 명확히 예외 처리
      if (!data || !data.nickname) {
        this.logger.warn(`존재하지 않는 닉네임(viewMatchStats): ${dto.viewNickname}`);
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }
      if (typeof data.brSoloStats !== 'undefined' || typeof data.brTrioStats !== 'undefined') {
        const brSoloStats = data.brSoloStats ? formatAggregateStatsBlock(data.brSoloStats, '솔로') : null;
        const brTrioStats = data.brTrioStats ? formatAggregateStatsBlock(data.brTrioStats, '트리오') : null;
        const mostPlayedChampType = getMostPlayedChampionType(data.brSoloStats, data.brTrioStats);
        let mostPlayedChampName = null;
        if (mostPlayedChampType !== null && mostPlayedChampType !== undefined) {
          const champKey = Number(mostPlayedChampType);
          mostPlayedChampName = CHAMP_NAMES[champKey] || mostPlayedChampType;
        }
        return {
          brSoloStats,
          brTrioStats,
          mostPlayedChampType,
          mostPlayedChampName,
        };
      } else {
        // 누적 rankPoint 및 Δ(증감) 포함, 최신순 정렬
        const summary = summarizeRecentMatches(data.matchRecords);
        const champSummary = summarizeRecentMatchesByChampion(data.matchRecords);
        return {
          nickname: data.nickname,
          passLevel: data.passLevel,
          matchRecords: Array.isArray(data.matchRecords)
            ? data.matchRecords.map((rec: any) => formatSingleMatchRecord(rec))
            : [],
          summary,
          champSummary,
        };
      }
    } catch (error) {
      this.logger.error('viewMatchStats API 오류', error);
      // 외부 API에서 404/400 등 status가 오면 NotFound로 변환
      if (error.response?.status === 404 || error.response?.status === 400) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }
      throw new HttpException('viewMatchStats 조회 실패', 500);
    }
  }

  /**
   * 최근 경기 상세 조회
   * @param userNetID
   * @param sessionSecret
   * @param dto
   */
  async viewMatchRecord(userNetID: string, sessionSecret: string, dto: ViewMatchRecordDto): Promise<any> {
    try {
      const resp = await this.httpService.axiosRef.get(`${this.BASE_URL}/user/viewMatchRecord`, {
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'deflate, gzip',
          'Connection': 'Keep-Alive',
          'User-Agent': 'X-UnrealEngine-Agent',
        },
        params: {
          userNetID,
          sessionSecret,
          viewNickname: dto.viewNickname,
        },
        timeout: 5000,
      });
      const data = resp.data?.data || {};
      // 닉네임이 없거나 잘못된 경우 명확히 예외 처리
      if (!data || !data.nickname) {
        this.logger.warn(`존재하지 않는 닉네임(viewMatchRecord): ${dto.viewNickname}`);
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }
      if (typeof data.brSoloStats !== 'undefined' || typeof data.brTrioStats !== 'undefined') {
        return {
          brSoloStats: data.brSoloStats ? formatAggregateStatsBlock(data.brSoloStats, '솔로') : null,
          brTrioStats: data.brTrioStats ? formatAggregateStatsBlock(data.brTrioStats, '트리오') : null,
        };
      } else {
        const summary = summarizeRecentMatches(data.matchRecords);
        const champSummary = summarizeRecentMatchesByChampion(data.matchRecords);
        return {
          nickname: data.nickname,
          passLevel: data.passLevel,
          // 누적 RP(totalRP) 계산 및 추가
            matchRecords: Array.isArray(data.matchRecords)
              ? data.matchRecords.map((rec: any) => formatSingleMatchRecord(rec))
              : [],
          summary,
          champSummary,
        };
      }
    } catch (error) {
      this.logger.error('viewMatchRecord API 오류', error);
      // 외부 API에서 404/400 등 status가 오면 NotFound로 변환
      if (error.response?.status === 404 || error.response?.status === 400) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }
      throw new HttpException('viewMatchRecord 조회 실패', 500);
    }
  }
}
