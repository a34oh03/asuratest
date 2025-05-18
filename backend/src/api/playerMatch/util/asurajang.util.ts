import { Logger } from '@nestjs/common';

/**
 * 시간 경과 문자열 포맷
 */
export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${days}일 전`;
}

/**
 * 플레이 시간 포맷 (초 → 분/초)
 */
export function formatPlayTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toLocaleString()}분 ${s.toLocaleString()}초`;
}

/**
 * 숫자 포맷 (천단위 구분)
 */
export function fmtNum(n: any): string {
  try {
    return Number(n).toLocaleString();
  } catch (err) {
    Logger.error('fmtNum 변환 오류', err);
    return String(n);
  }
}

/**
 * 백분율 계산
 */
export function avgPercent(part: number, total: number): string {
  const pct = total ? (part / total) * 100 : 0;
  return `${pct.toFixed(0)}%`;
}
