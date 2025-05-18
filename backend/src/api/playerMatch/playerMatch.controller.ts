import {
  Controller, Get, Query, Body, Post, Logger, InternalServerErrorException, NotFoundException, Res
} from '@nestjs/common';
import { Response } from 'express';
import { PlayerMatchService } from './playerMatch.service';
import { ViewMatchStatsDto } from './dto/view-match-stats.dto';
import { ViewMatchRecordDto } from './dto/view-match-record.dto';

// 실제 서비스 환경에서는 아래 값을 환경변수로 분리해야 합니다.
const USER_NET_ID = '76561199543345410'; // TODO: 실서비스 시 환경변수로 분리
const SESSION_SECRET = '2a95431a72dc2fb33efcc1f3febf3a00'; // TODO: 실서비스 시 환경변수로 분리

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
      const data = await this.playerMatchService.viewMatchStats(USER_NET_ID, SESSION_SECRET, query);
      return res.status(200).json(data);
    } catch (error) {
      this.logger.error('getMatchStats 오류', error);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: '통계 조회 실패' });
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
  async getMatchRecord(@Query() query: ViewMatchRecordDto, @Res() res: Response) {
    try {
      const data = await this.playerMatchService.viewMatchRecord(USER_NET_ID, SESSION_SECRET, query);
      return res.status(200).json(data);
    } catch (error) {
      this.logger.error('getMatchRecord 오류', error);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: '전적 조회 실패' });
    }
  }
}
