import { Controller, Get, Req, Headers, OnModuleInit } from '@nestjs/common';
import { PingService } from './ping.service';

let lastAccessTime = Date.now();
const WAKE_UP_INTERVAL_MIN = 10;

// 서버가 sleep 모드로 진입하지 않도록 주기적으로 자기 자신에게 ping API 호출
// OnModuleInit 사용, 예외처리 및 주석 추가
@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  // 서버가 완전히 실행된 후 main.ts에서 호출할 ping 반복 함수
  startPingLoop() {
    // 최초 1회 호출 및 로그
    this.pingService.pingSelfApi().then(() => {
      this.pingService.logger?.log('[PingController] 서버 기동 후 최초 ping 수행 완료');
    }).catch((e) => {
      this.pingService.logger?.error('[PingController] 최초 ping 예외:', e);
    });
    setInterval(() => {
      this.pingService.pingSelfApi();
    }, WAKE_UP_INTERVAL_MIN * 60 * 1000);
    this.pingService.logger?.log(`[PingController] ping 반복 호출 시작 (interval: ${WAKE_UP_INTERVAL_MIN}분)`);
  }

  @Get('ping')
  ping(@Req() req: any, @Headers('x-forwarded-for') remoteAddr?: string) {
    if (req.method === 'HEAD') {
      lastAccessTime = Date.now();
      return '';
    }
    lastAccessTime = Date.now();
    return {
      message: `pong`,
      remote: remoteAddr || req.ip || '',
      lastAccessTime,
      info: `접속시각 갱신, ${WAKE_UP_INTERVAL_MIN}분마다 ping 으로 서버 깨우기`,
    };
  }
}
