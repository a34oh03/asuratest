// 🔁 서버 컴포넌트
import { fetchRankingSummary } from '../services/rankingService';
import RankingRateLimit from './RateLimit';
import RankingError from './RankingError';
import RankingClient from './RankingClient'; 

export default async function RankingPage() {
  try {
    const data = await fetchRankingSummary();
    return <RankingClient data={data} />;
  } catch (e: any) {
    if (e instanceof Error && (e as any).cause?.status === 429) {
      return <RankingRateLimit />;
    }
    if (typeof e === 'object' && e !== null && 'message' in e && (e as any).message?.includes('429')) {
      return <RankingRateLimit />;
    }
    return <RankingError />;
  }
}