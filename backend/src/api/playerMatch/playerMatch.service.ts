import {
  Injectable,
  Logger,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ViewMatchStatsDto } from './dto/view-match-stats.dto';
import { ViewMatchRecordDto } from './dto/view-match-record.dto';
import {
  CHAMP_NAMES,
  MMR_LABELS,
  REGION_LABELS,
  ITEM_NAMES,
  PLAY_MAP,
  TEAM_MAP,
} from './constants/playerMatch.constants';
import {
  fmtNum,
  avgPercent,
  formatElapsed,
  formatPlayTime,
} from './util/asurajang.util';
import {
  formatAggregateStatsBlock,
  formatSingleMatchRecord,
  getMostPlayedChampionType,
  summarizeRecentMatches,
  summarizeRecentMatchesByChampion,
} from './playerMatch.format';

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
  async viewMatchStats(
    userNetID: string,
    sessionSecret: string,
    dto: ViewMatchStatsDto,
  ): Promise<any> {
    try {
      // 외부 API 호출
      const resp = await this.httpService.axiosRef.get(
        `${this.BASE_URL}/user/viewMatchStats`,
        {
          headers: {
            Accept: '*/*',
            'Accept-Encoding': 'deflate, gzip',
            Connection: 'Keep-Alive',
            'User-Agent': 'X-UnrealEngine-Agent',
          },
          params: {
            userNetID,
            sessionSecret,
            viewNickname: dto.viewNickname,
            region: dto.region || 'ES',
          },
          timeout: 5000,
        },
      );

  //    this.logger.log('viewMatchStats 외부 API 응답', resp.data);
      const data = resp.data?.data;

      // 닉네임이 없거나 잘못된 경우 → 404 처리
      if (!data || !data.nickname) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }

      // 정상 데이터 포맷팅
      const brSoloStats = data.brSoloStats
        ? formatAggregateStatsBlock(data.brSoloStats, '솔로')
        : null;
      const brTrioStats = data.brTrioStats
        ? formatAggregateStatsBlock(data.brTrioStats, '트리오')
        : null;
      const tagMatchStats = data.tagMatchStats
        ? formatAggregateStatsBlock(data.tagMatchStats, '태그매치')
        : null;
      const mostPlayedChampType = getMostPlayedChampionType(
        data.brSoloStats,
        data.brTrioStats,
        data.tagMatchStats,
      );
      let mostPlayedChampName = null;
      if (mostPlayedChampType != null) {
        mostPlayedChampName =
          CHAMP_NAMES[Number(mostPlayedChampType)] || mostPlayedChampType;
      }

      return {
        brSoloStats,
        brTrioStats,
        tagMatchStats,
        mostPlayedChampType,
        mostPlayedChampName,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const errData = error?.response?.data || error;
      this.logger.error('viewMatchStats API 오류', errData);

      // 외부 API가 400을 반환하면 404(Not Found)로 전환
      if (status === 400) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }

      // 그 외(401, 네트워크 오류 등)는 401로 응답
      throw new HttpException('viewMatchStats 조회 실패', 401);
    }
  }

  /**
   * 최근 경기 상세 조회
   * @param userNetID
   * @param sessionSecret
   * @param dto
   */
  async viewMatchRecord(
    userNetID: string,
    sessionSecret: string,
    dto: ViewMatchRecordDto,
  ): Promise<any> {
    try {
    //  console.log(
        //`viewMatchRecord 호출: ${userNetID}, ${sessionSecret}, ${JSON.stringify(
//          dto,
        //)}`,
      //);

      // 외부 API 호출
      const resp = await this.httpService.axiosRef.get(
        `${this.BASE_URL}/user/viewMatchRecord`,
        {
          headers: {
            Accept: '*/*',
            'Accept-Encoding': 'deflate, gzip',
            Connection: 'Keep-Alive',
            'User-Agent': 'X-UnrealEngine-Agent',
          },
          params: {
            userNetID,
            sessionSecret,
            viewNickname: dto.viewNickname,
          },
          timeout: 5000,
        },
      );

    //  this.logger.log('viewMatchRecord 외부 API 응답', resp.data);
      this.logger.log('viewMatchRecord 외부 API 응답', resp.data?.data.nickname ? resp.data?.data.nickname : ".");
      const data = resp.data?.data || {};

      // 닉네임이 없거나 잘못된 경우 → 404 처리
      if (!data || !data.nickname) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }

      // matchRecords 포맷팅
      if (typeof data.matchRecords !== 'undefined') {
        const summary = summarizeRecentMatches(data.matchRecords);
        const champSummary = summarizeRecentMatchesByChampion(
          data.matchRecords,
        );
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

      // matchList 포맷팅
      if (typeof data.matchList !== 'undefined') {
        return {
          matchList: data.matchList,
          nickname: data.nickname,
          userNetID: data.userNetID,
        };
      }

      // fallback: 예외는 아니지만 데이터가 없는 경우
      return null;
    } catch (error: any) {
      const status = error?.response?.status;
      const errData = error?.response?.data || error;
      this.logger.error('viewMatchRecord API 오류', errData);

      // 외부 API가 400 또는 404를 반환하면 NotFoundException으로 전환
      if (status === 400 || status === 404) {
        throw new NotFoundException('존재하지 않는 닉네임입니다.');
      }

      // 그 외(401, 네트워크 오류 등)는 401로 응답
      throw new HttpException('viewMatchRecord 조회 실패', 401);
    }
  }
}
