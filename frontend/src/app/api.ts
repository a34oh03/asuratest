import axios from 'axios';

export interface Player {
  rank: number;
  nickname: string;
  champion: string;
  score: number;
  rank_change?: number | string;
  score_change?: number | null;
  nickname_raw?: string;
}

export interface RankingSummary {
  solo_players: Player[];
  trio_players: Player[];
  solo_stats: { labels: string[]; counts: number[] };
  trio_stats: { labels: string[]; counts: number[] };
  last_backup: string;
  now_time: string;
}

export async function fetchRankingSummary(userNetIDs: string): Promise<RankingSummary> {
  const res = await axios.get<RankingSummary>(
    `/api/ranking/summary?userNetIDs=${encodeURIComponent(userNetIDs)}`
  );
  return res.data;
}
