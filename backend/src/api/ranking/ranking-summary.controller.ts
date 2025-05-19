import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { RankingSummaryService } from './ranking-summary.service';
import { RateLimitGuard } from '../utility.ts/rate-limit.guard';

@UseGuards(RateLimitGuard)
@Controller('api/ranking')
export class RankingSummaryController {
  constructor(private readonly summaryService: RankingSummaryService) {}

  /**
   * Next.js에서 메인 랭킹 데이터를 요청하는 엔드포인트
   * 쿼리: userNetIDs=aaa,bbb,ccc
   */
  @Get('summary')
  async getSummary(@Req() req: Request) {
    console.log('[GET /ranking/summary] 전체 URL:', req.url);
    // 서버 내부에서만 관리하는 userID 리스트 (예시)
    ////userNetIDs ? userNetIDs.split(',').filter(Boolean) : [];
    const userList = ["76561199543345410","76561198112838034"]; // 실제 유효한 userID를 배열로 넣어야 함
    return this.summaryService.getRankingSummary(userList);
  }
}
