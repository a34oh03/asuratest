import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';

// 메모리 기반 IP별 카운터 (실제 운영에서는 Redis 등 외부 저장소 권장)
const ipCounters = new Map<string, { count: number; timestamp: number }>();
const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 15;

function getClientIp(req: Request): string {
  let ip = req.ip;
  if (Array.isArray(ip)) ip = ip[0];
  if (!ip || ip === '::1') {
    const fwd = req.headers['x-forwarded-for'];
    if (Array.isArray(fwd)) return fwd[0];
    if (typeof fwd === 'string') return fwd;
    ip = req.connection?.remoteAddress || 'unknown';
  }
  return ip;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = getClientIp(req);
    const now = Date.now();
    const counter = ipCounters.get(ip) || { count: 0, timestamp: now };
    if (now - counter.timestamp > WINDOW_MS) {
      // 윈도우 리셋
      counter.count = 1;
      counter.timestamp = now;
    } else {
      counter.count++;
    }
    ipCounters.set(ip, counter);
    if (counter.count > MAX_REQUESTS) {
      throw new HttpException('Too Many Requests', 429);
    }
    return true;
  }
}
