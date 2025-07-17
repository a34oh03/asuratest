import {
  Logger,
} from '@nestjs/common';

export function getSessionSecret(): string {
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