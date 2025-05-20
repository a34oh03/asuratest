import {
  Controller,
  Get,
  Query,
  Body,
  Post,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PlayerMatchService } from './playerMatch.service';
import { ViewMatchStatsDto } from './dto/view-match-stats.dto';
import { ViewMatchRecordDto } from './dto/view-match-record.dto';

// USER_NET_ID, SESSION_SECRET 환경변수로 분리 (예외처리 및 로깅)
function getUserNetId(): string {
  try {
    const id = process.env.USER_NET_ID;
    if (!id) {
      // 로그 및 예외처리
      Logger.error('USER_NET_ID 환경변수 미설정', 'PlayerMatchController');
      throw new Error('USER_NET_ID 환경변수 미설정');
    }
    return id;
  } catch (e) {
    Logger.error(`USER_NET_ID 예외: ${(e as Error).message}`, 'PlayerMatchController');
    throw e;
  }
}

function getSessionSecret(): string {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      Logger.error('SESSION_SECRET 환경변수 미설정', 'PlayerMatchController');
      throw new Error('SESSION_SECRET 환경변수 미설정');
    }
    return secret;
  } catch (e) {
    Logger.error(`SESSION_SECRET 예외: ${(e as Error).message}`, 'PlayerMatchController');
    throw e;
  }
}

// 할거 : 14분마다 ping 보내는거 확인하기, 12시 되면 데이터 백업 하는지 확인하기, 환경 변수로 값 등록하기, refresh session 추가하기
@Controller('player-match')
export class PlayerMatchController {
  private readonly logger = new Logger(PlayerMatchController.name);

  constructor(private readonly playerMatchService: PlayerMatchService) {}

  /**
   * 솔로/트리오 통계 조회 API
   * GET /player-match/match-stats?viewNickname=xxx&region=ES
   */
  /**
   * 솔로/트리오 통계 조회 API (명시적 예외처리)
   * GET /player-match/match-stats?viewNickname=xxx&region=ES
   */
  @Get('match-stats')
  async getMatchStats(@Query() query: ViewMatchStatsDto, @Res() res: Response) {
    try {
      const data = await this.playerMatchService.viewMatchStats(
        getUserNetId(),
        getSessionSecret(),
        query,
      );
      return res.status(200).json(data);
    } catch (error) {
      this.logger.error('getMatchStats 오류', error);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: '잘못된 닉네임 조회' });
      }
      return res.status(401).json({ message: '주인장 세션 만료' });
    }
  }

  /**
   * 최근 경기 상세 조회 API
   * GET /player-match/match-record?viewNickname=xxx
   */
  /**
   * 최근 경기 상세 조회 API (명시적 예외처리)
   * GET /player-match/match-record?viewNickname=xxx
   */
  @Get('match-record')
  async getMatchRecord(
    @Query() query: ViewMatchRecordDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.playerMatchService.viewMatchRecord(
        getUserNetId(),
        getSessionSecret(),
        query,
      );
      return res.status(200).json(data);
    } catch (error) {
      this.logger.error('getMatchRecord 오류', error);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(401).json({ message: '전적 조회 실패' });
    }
  }
}
