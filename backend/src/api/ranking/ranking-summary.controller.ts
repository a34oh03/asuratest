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
    // USER_LIST 환경변수에서 유저 ID 배열을 받아옴 (예: 'id1,id2')
function getUserList(): string[] {
  try {
    const raw = process.env.USER_LIST;
    if (!raw) {
      // 로그 및 예외처리
      console.error('USER_LIST 환경변수 미설정 (ranking-summary.controller.ts)');
      throw new Error('USER_LIST 환경변수 미설정');
    }
    // 콤마로 구분된 값 -> 배열 변환
    return raw.split(',').map(x => x.trim()).filter(Boolean);
  } catch (e) {
    console.error('USER_LIST 파싱 예외:', e);
    throw e;
  }
}
    const userList = getUserList();
    return this.summaryService.getRankingSummary(userList);
  }
}
