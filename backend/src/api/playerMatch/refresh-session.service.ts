// refresh-session.service.ts
// 주기적으로 refreshSession API를 호출하여 세션을 갱신
// USER_NET_ID, SESSION_SECRET 등은 환경변수에서 안전하게 가져옴
// 예외처리, 로깅, 주석 등 유저 룰 준수
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RefreshSessionService {
  public readonly logger = new Logger(RefreshSessionService.name);
  private readonly intervalMs = 10 * 60 * 1000; // 10분

  // 서버가 완전히 실행된 후 main.ts에서 호출할 반복 실행 함수
  startRefreshLoop() {
    this.runRefreshSession().then(() => {
      this.logger?.log('[RefreshSessionService] 서버 기동 후 최초 refreshSession 수행 완료');
    }).catch((e) => {
      this.logger?.error('[RefreshSessionService] 최초 refreshSession 예외:', e);
    });
    setInterval(() => {
      this.runRefreshSession();
    }, this.intervalMs);
    this.logger?.log(`[RefreshSessionService] refreshSession 반복 호출 시작 (interval: ${this.intervalMs/60000}분)`);
  }

  async runRefreshSession() {
    const url = 'http://live.surajang.com:6557/user/refreshSession';
    const userNetID = process.env.USER_NET_ID;
    const sessionSecret = process.env.SESSION_SECRET;
    const seqNo = parseInt(process.env.SEQ_NO || '39', 10); // 기본값 39
    const culture = parseInt(process.env.CULTURE || '1', 10); // 기본값 1
    const version = process.env.VERSION || '1.0.152.0.sp1'; // 기본값

    // 환경변수 예외처리
    if (!userNetID || !sessionSecret) {
      this.logger.error('USER_NET_ID, SESSION_SECRET 환경변수 미설정');
      return;
    }

    // Raw body 문자열 생성 (Python 코드와 동일)
    const payload = JSON.stringify({
      userNetID,
      sessionSecret,
      seqNo,
      culture,
      version,
    }, null, 4);

    const contentLength = Buffer.byteLength(payload, 'utf-8');
    const headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'deflate, gzip',
      'Connection': 'Keep-Alive',
      'User-Agent': 'X-UnrealEngine-Agent',
      'Content-Type': 'application/json',
      'Content-Length': contentLength,
    };

    try {
      const resp = await axios.post(url, payload, {
        headers,
        timeout: 5000,
        // 예외처리: 서버 연결 실패 등
        validateStatus: (status) => status >= 200 && status < 500,
      });
      if (!resp.data) {
        this.logger.error('refreshSession 응답 바디가 비어 있음');
        return;
      }
      const now = new Date().toISOString();
      if (resp.data?.data) {
        //this.logger.log(`refresh OK`);// → resultCode=${resp.data.data.resultCode}, seqNo=${resp.data.data.seqNo}`);
      } else {
        this.logger.warn(`[${now}] refresh 응답: ${JSON.stringify(resp.data)}`);
      }
    } catch (e) {
      this.logger.error(`[refreshSession] 예외: ${(e as Error).message}`);
    }
  }
}
