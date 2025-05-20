import {
  CHAMP_NAMES,
  MMR_LABELS,
  REGION_LABELS,
  ITEM_NAMES,
  PLAY_MAP,
  TEAM_MAP,
} from './constants/playerMatch.constants';
import {
  fmtNum,
  avgPercent,
  formatElapsed,
  formatPlayTime,
} from './util/asurajang.util';

/**
 * 솔로/트리오 통계 블록 데이터 가공 (Python display_stats 변환)
 */
export function getMostPlayedChampionType(
  soloBlock: any,
  trioBlock: any,
): string | null {
  // 두 블록의 playedChamps를 합산하여 가장 많이 플레이한 champType 반환
  const countMap: Record<string, number> = {};
  const merge = (arr: any[]) => {
    arr.forEach((ch) => {
      const key = ch.champType;
      const cnt = Number(ch.matches) || 0;
      countMap[key] = (countMap[key] || 0) + cnt;
    });
  };
  if (soloBlock?.playedChamps) merge(soloBlock.playedChamps);
  if (trioBlock?.playedChamps) merge(trioBlock.playedChamps);
  let maxKey: string | null = null;
  let maxVal = 0;
  for (const [key, val] of Object.entries(countMap)) {
    if (val > maxVal) {
      maxKey = key;
      maxVal = val;
    }
  }
  return maxKey;
}

export function formatAggregateStatsBlock(block: any, name: string) {
  if (!block) return null;
  const {
    rankPos = 0,
    matches = 0,
    topRanks = 0,
    firstRanks = 0,
    kills = 0,
    avgMatchRank = 0,
    rankPoiont = 0,
    avgDamagePut = 0,
    purgatoryEscapes = 0,
    playedChamps = [],
  } = block;
  const avgKill = matches ? kills / matches : 0;
  return {
    name,
    rankPoint: fmtNum(rankPoiont),
    rankPosition: fmtNum(rankPos + 1),
    matches: fmtNum(matches),
    firstRanks: `${fmtNum(firstRanks)} (${avgPercent(firstRanks, matches)})`,
    topRanks: `${fmtNum(topRanks)} (${avgPercent(topRanks, matches)})`,
    kills: fmtNum(kills),
    avgKill: avgKill.toFixed(2),
    mmrLabel: MMR_LABELS[avgMatchRank] || avgMatchRank,
    avgDamagePut: fmtNum(avgDamagePut),
    purgatoryEscapes: fmtNum(purgatoryEscapes),
    playedChamps: Array.isArray(playedChamps)
      ? playedChamps.map((ch: any) => ({
          champName: CHAMP_NAMES[ch.champType] || ch.champType,
          matches: fmtNum(ch.matches || 0),
          topRanks: `${fmtNum(ch.topRanks || 0)} (${avgPercent(ch.topRanks, ch.matches || 0)})`,
        }))
      : [],
  };
}

/**
 * 단일 매치 레코드 데이터 가공 (Python print_match_records 변환)
 */
// 최근 n경기 요약 통계 생성
export function summarizeRecentMatches(records: any[], n = 20) {
  if (!records?.length) return null;
  const recent = records.slice(0, n);
  const ranks = recent
    .map((r) => (typeof r.matchRank === 'number' ? r.matchRank : null))
    .filter((r) => r !== null);
  const nGames = ranks.length;
  const avgRank = nGames ? ranks.reduce((a, b) => a + b, 0) / nGames : 0;
  const winCount = ranks.filter((r) => r === 1).length;
  const top3Count = ranks.filter((r) => r && r <= 3).length;
  const avgTK = nGames
    ? recent.reduce((a, b) => a + (b.teamsKill || 0), 0) / nGames
    : 0;
  const avgDmgPut = nGames
    ? recent.reduce((a, b) => a + (b.dmgPut || 0), 0) / nGames
    : 0;
  const avgDmgGot = nGames
    ? recent.reduce((a, b) => a + (b.dmgGot || 0), 0) / nGames
    : 0;
  return {
    recentRanks: ranks,
    avgRank: Number(avgRank.toFixed(2)),
    winCount,
    top3Count,
    avgTK: Number(avgTK.toFixed(2)),
    avgDmgPut: Math.round(avgDmgPut),
    avgDmgGot: Math.round(avgDmgGot),
  };
}

// 캐릭터별 요약 통계 (champType 기준)
export function summarizeRecentMatchesByChampion(records: any[], n = 20) {
  if (!records?.length) return [];
  const recent = records.slice(0, n);
  const champMap: Record<string, any[]> = {};
  recent.forEach((r) => {
    if (r.champType == null) return;
    const key = String(r.champType);
    if (!champMap[key]) champMap[key] = [];
    champMap[key].push(r);
  });

  return Object.entries(champMap).map(([champType, arr]) => {
    const ctNum = Number(champType);
    const games = arr.length;
    const sum = (key: string) => arr.reduce((a, b) => a + (b[key] || 0), 0);
    // 평정(1등) 횟수
    const winCount = arr.filter((r) => r.matchRank === 1).length;
    // TOP 3 진입 횟수
    const top3Count = arr.filter(
      (r) => typeof r.matchRank === 'number' && r.matchRank <= 3,
    ).length;
    // 평균 등수 (0부터 시작하므로 +1)
    const avgRank = games
      ? Number(
          (
            arr.reduce(
              (a, b) => a + (typeof b.matchRank === 'number' ? b.matchRank : 0),
              0,
            ) / games
          ).toFixed(2),
        )
      : 0;
    // 평균 획득 점수 (deltaRP)
    const avgScore = games ? Number((sum('deltaRP') / games).toFixed(2)) : 0;
    return {
      champType: ctNum,
      champName: CHAMP_NAMES[ctNum] || champType,
      games,
      avgTK: Number((sum('teamsKill') / games).toFixed(2)),
      winCount,
      top3Count,
      avgRank,
      avgDmgPut: Math.round(sum('dmgPut') / games),
      avgDmgGot: Math.round(sum('dmgGot') / games),
      avgScore,
    };
  });
}

/** 전적에 필요한 데이터 가공 */
export function formatSingleMatchRecord(rec: any) {
  if (!rec) return null;
  const nowTs = Math.floor(Date.now() / 1000);
  const t = rec.finishedTimeAt
    ? new Date(rec.finishedTimeAt * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16)
    : '';
  const elapsed = rec.finishedTimeAt
    ? formatElapsed(nowTs - rec.finishedTimeAt)
    : '';
  const allyChampType1 = CHAMP_NAMES[rec.allyChampType1] || rec.allyChampType1;
  const allyChampType2 = CHAMP_NAMES[rec.allyChampType2] || rec.allyChampType2;
  const rank = fmtNum(rec.matchRank ?? 0);
  const mode = `${PLAY_MAP[rec.playMode] || '-'} - ${TEAM_MAP[rec.teamMode] || '-'}`;
  const champ = CHAMP_NAMES[rec.champType] || rec.champType;
  const dmgPut = fmtNum(rec.dmgPut || 0);
  const dmgGot = fmtNum(rec.dmgGot || 0);
  const myKill = fmtNum(rec.myKill || 0);
  const teamsKill = fmtNum(rec.teamsKill || 0);
  const playMode = rec.playMode || 1;
  const teamMode = rec.teamMode || 1;
  const assists = fmtNum(rec.assists || 0);
  const delta = fmtNum(rec.deltaRP || 0);
  const mmr = MMR_LABELS[rec.mmrGroupTitle] || rec.mmrGroupTitle;
  const region = REGION_LABELS[rec.region] || rec.region;
  const playTime = formatPlayTime(rec.playTimeSec || 0);
  // 아이템 정보 가공
  const items = [1, 4, 3, 5, 6, 2].map((s) => {
    const idx = rec[`astraIndex${s}`] || 0;
    return `${ITEM_NAMES[idx] || idx}`;
  });
  const astra = [1, 4, 3, 5, 6, 2].map((s) => {
    const lv = rec[`astraLv${s}`] || 0;
    return `${lv}`;
  });

  return {
    time: t,
    elapsed,
    allyChampType1,
    allyChampType2,
    rank,
    mode,
    champ,
    dmgPut,
    dmgGot,
    myKill,
    teamsKill,
    playMode,
    teamMode,
    assists,
    delta,
    mmr,
    region,
    playTime,
    items: items.join(', '),
    astra: astra.join(', '),
  };
}
