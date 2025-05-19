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
   * 매치 통계 조회
   * @param userNetID
   * @param sessionSecret
   * @param dto
   */
  async viewMatchStats(userNetID: string, sessionSecret: string, dto: ViewMatchStatsDto): Promise<any> {
    try {
      console.log(`viewMatchStats 호출: ${userNetID}, ${sessionSecret}, ${JSON.stringify(dto)}`);
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
        this.logger.log('viewMatchStats 외부 API 응답', resp.data);
        const data = resp.data?.data || {};
        // 닉네임이 없거나 잘못된 경우 명확히 예외 처리
        if (!data || !data.nickname) {
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
        }
      } catch (apiError: any) {
        this.logger.error('viewMatchStats 외부 API 호출 실패', apiError?.response?.data || apiError);
        throw new HttpException('viewMatchStats 외부 API 호출 실패', 500);
      }
    } catch (error: any) {
      this.logger.error('viewMatchStats API 오류', error?.response?.data || error);
      if (error.response?.status === 404 || error.response?.status === 400) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }
      throw new HttpException('viewMatchStats 조회 실패', 500);
    }
    // fallback: 데이터가 없을 때
    return null;
  }

  /**
   * 최근 경기 상세 조회
   * @param userNetID
   * @param sessionSecret
   * @param dto
   */
  async viewMatchRecord(userNetID: string, sessionSecret: string, dto: ViewMatchRecordDto): Promise<any> {
    try {
      console.log(`viewMatchRecord 호출: ${userNetID}, ${sessionSecret}, ${JSON.stringify(dto)}`);
      let resp: any;
      try {
        resp = await this.httpService.axiosRef.get(`${this.BASE_URL}/user/viewMatchRecord`, {
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
        this.logger.log('viewMatchRecord 외부 API 응답', resp.data);
        const data = resp.data?.data || {};
        // 닉네임이 없거나 잘못된 경우 명확히 예외 처리
        if (!data || !data.nickname) {
          throw new NotFoundException('존재하지 않는 닉네임입니다.');
        }
        if (typeof data.matchRecords !== 'undefined') {
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
        } else if (typeof data.matchList !== 'undefined') {
          return {
            matchList: data.matchList,
            nickname: data.nickname,
            userNetID: data.userNetID,
          };
        }
        // fallback: 데이터가 없을 때
        return null;
      } catch (apiError: any) {
        this.logger.error('viewMatchRecord 외부 API 호출 실패', apiError?.response?.data || apiError);
        throw new HttpException('viewMatchRecord 외부 API 호출 실패', 500);
      }
    } catch (error: any) {
      this.logger.error('viewMatchRecord API 오류', error?.response?.data || error);
      if (error.response?.status === 404 || error.response?.status === 400) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }
      throw new HttpException('viewMatchRecord 조회 실패', 500);
    }
    // fallback: 예외 발생하지 않았지만 데이터가 없을 때
    return null;
  }
}
