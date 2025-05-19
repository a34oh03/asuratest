import { Controller, Get, Req, Headers } from '@nestjs/common';

let lastAccessTime = Date.now();
const WAKE_UP_INTERVAL_MIN = 14;

@Controller('api/ping')
export class PingController {
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
