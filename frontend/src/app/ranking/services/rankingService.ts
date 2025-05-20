import { RankingSummary } from '../types';

export async function fetchRankingSummary(): Promise<RankingSummary> {
  // 실제 배포시에는 BASE_URL을 환경변수로 분리 권장
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${BASE_URL}/ranking/summary`;
  console.log('[fetchRankingSummary] 요청 URL:', url);

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 429) throw new Error('rate-limit');
  if (res.status === 400) throw new Error('bad-request');
  if (!res.ok) throw new Error('Failed to fetch ranking summary');
  return res.json();
}
