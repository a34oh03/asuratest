export interface Player {
  rank: number;
  nickname: string;
  champion: string;
  score: number;
  rank_change?: string | number;
  score_change?: number | null;
  nickname_raw?: string;
}

export interface ChampionStats {
  labels: string[];
  counts: number[];
}

export interface RankingSummary {
  solo_players: Player[];
  trio_players: Player[];
  tagMatch_players: Player[];
  solo_stats: ChampionStats;
  trio_stats: ChampionStats;
  tagMatch_stats: ChampionStats;
  last_backup: string | null;
  now_time: string;
}
