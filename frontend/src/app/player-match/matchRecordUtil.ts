// 최근 경기 요약/캐릭터별 통계/상세 데이터 가공 유틸
// 모든 예외 가능성(파싱, undefined 등)에 대해 예외 처리, 주석 포함
// mmr, 모드명 등은 임의 매핑, 필요시 사용자에게 전달

export type MatchRecord = {
  time: string;
  elapsed: string;
  rank: number;
  mode: string;
  champ: string;
  dmgPut: number;
  dmgGot: number;
  myKill: number;
  teamsKill?: number;
  assists?: number;
  delta: number;
  mmr: number;
  mmrLabel?: string;
  region?: string;
  playTime: number;
  items: string;
  playMode?: number;
  teamMode?: number;
};

// mmr 점수에 따른 등급 매핑 (임의값, 실제 기준 필요시 알려주세요)
export function getMmrLabel(mmr: number): string {
  if (mmr >= 10000) return '매우 높음';
  if (mmr >= 7000) return '높음';
  return '보통';
}

// 모드명 변환
export function getModeName(playMode?: number, teamMode?: number): string {
  if (playMode === 1 && teamMode === 1) return '배틀로얄 - 솔로';
  if (playMode === 1 && teamMode === 2) return '배틀로얄 - 트리오';
  return '기타';
}

// 초 → 분:초
export function formatPlayTime(sec: number): string {
  if (!sec || typeof sec !== 'number') return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s}초`;
}

// 최근 N경기 요약 통계
export function calcSummary(records: MatchRecord[], N = 20) {
  const arr = records.slice(0, N);
  const sum = (key: keyof MatchRecord) => arr.reduce((a, b) => a + Number(b[key] ?? 0), 0);
  return {
    avgRank: arr.length ? (sum('rank') / arr.length).toFixed(2) : '-',
    avgKill: arr.length ? (sum('myKill') / arr.length).toFixed(2) : '-',
    avgAssist: arr.length ? (sum('assists') / arr.length).toFixed(2) : '-',
    avgTeamsKill: arr.length ? (sum('teamsKill') / arr.length).toFixed(2) : '-',
    avgDmgPut: arr.length ? (sum('dmgPut') / arr.length).toLocaleString() : '-',
    avgDmgGot: arr.length ? (sum('dmgGot') / arr.length).toLocaleString() : '-',
    avgDelta: arr.length ? (sum('delta') / arr.length).toFixed(2) : '-',
    top3: arr.filter(r => r.rank <= 3).length,
    count: arr.length,
  };
}

// 캐릭터별 통계
export function calcChampSummary(records: MatchRecord[], N = 20) {
  const arr = records.slice(0, N);
  const byChamp: Record<string, MatchRecord[]> = {};
  arr.forEach(r => {
    if (!byChamp[r.champ]) byChamp[r.champ] = [];
    byChamp[r.champ].push(r);
  });
  return Object.entries(byChamp).map(([champ, recs]) => ({
    champ,
    count: recs.length,
    avgKill: (recs.reduce((a, b) => a + (b.myKill ?? 0), 0) / recs.length).toFixed(2),
    avgAssist: (recs.reduce((a, b) => a + (b.assists ?? 0), 0) / recs.length).toFixed(2),
    avgTeamsKill: (recs.reduce((a, b) => a + (b.teamsKill ?? 0), 0) / recs.length).toFixed(2),
    avgDmgPut: (recs.reduce((a, b) => a + (b.dmgPut ?? 0), 0) / recs.length).toLocaleString(),
    avgDmgGot: (recs.reduce((a, b) => a + (b.dmgGot ?? 0), 0) / recs.length).toLocaleString(),
    top3: recs.filter(r => r.rank <= 3).length,
  }));
}

// 포인트 변화 계산 (rankPoint, delta)
export function calcRankPoints(records: MatchRecord[], baseRankPoint: number) {
  // 최신 경기부터 baseRankPoint에서 delta를 역순으로 누적
  const arr = records.slice(0, 20);
  let pt = baseRankPoint;
  return arr.map((rec, idx) => {
    const prev = pt;
    pt -= Number(rec.delta ?? 0);
    return {
      ...rec,
      rankPoint: prev,
      rankDelta: rec.delta,
    };
  });
}
