// ping.service.ts: 자기 자신에게 ping API를 주기적으로 호출하여 sleep 방지
// 예외처리 및 로깅 포함, 환경변수로 ping url 관리
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PingService {
  // ping.controller에서 접근할 수 있도록 public으로 변경
  public readonly logger = new Logger(PingService.name);

  async pingSelfApi() {
    const url = process.env.PING_URL || 'http://localhost:3000/api/ping/ping';
    try {
      const res = await axios.get(url);
      this.logger.log(`Ping 성공: ${JSON.stringify(res.data)}`);
    } catch (error) {
      this.logger.error(`Ping 실패: ${error instanceof Error ? error.message : error}`);
    }
  }
}
