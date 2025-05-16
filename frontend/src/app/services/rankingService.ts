import { RankingSummary } from '../ranking/types';

export async function fetchRankingSummary(): Promise<RankingSummary> {
  // 실제 배포시에는 BASE_URL을 환경변수로 분리 권장
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${BASE_URL}/api/ranking/summary`;
  console.log('[fetchRankingSummary] 요청 URL:', url);

  const res = await fetch(url, { cache: 'no-store' });
  console.log('[fetchRankingSummary] 응답 상태:', res.status);

  if (!res.ok) throw new Error('Failed to fetch ranking summary');
  return res.json();
}
