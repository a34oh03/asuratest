// 랭킹 관련 유틸 함수 모음 (Python 코드 변환)
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

export const championMap: Record<number, string> = {
  1: '바쥬',
  2: '파이라',
  3: '바라타',
  4: '무이무이',
  5: '등오',
  6: '하누만',
  7: '비카랄라',
  8: '유안',
  9: '여울',
  10: '테타누치',
  11: '카이사치',
  12: '레이',
  13: '웨이',
  17: '쇼요',
};

export function parsePlayers(playersRaw: any[]): any[] {
  const players = [];
  for (let i = 0; i < playersRaw.length; i += 4) {
    try {
      const nickname = playersRaw[i];
      const score = Number(playersRaw[i + 1]);
      const champId = Number(playersRaw[i + 2]);
      const champion = championMap[champId] ?? `알 수 없음(${champId})`;
      players.push({
        rank: Math.floor(i / 4) + 1,
        nickname,
        score,
        champion,
      });
    } catch {
      continue;
    }
  }
  return players;
}

export function calculateChampionStats(playersRaw: any[]): {
  labels: string[];
  counts: number[];
} {
  const counter: Record<number, number> = {};
  for (let i = 0; i < playersRaw.length; i += 4) {
    try {
      const champId = Number(playersRaw[i + 2]);
      counter[champId] = (counter[champId] || 0) + 1;
    } catch {
      continue;
    }
  }
  // 모든 캐릭터 포함시키기
  const fullStats: Record<number, number> = {};
  for (const cid of Object.keys(championMap).map(Number)) {
    fullStats[cid] = counter[cid] || 0;
  }
  const sortedChamps = Object.entries(fullStats).sort((a, b) => b[1] - a[1]);
  const labels = sortedChamps.map(
    ([cid]) => championMap[Number(cid)] ?? String(cid),
  );
  const counts = sortedChamps.map(([, count]) => count);
  return { labels, counts };
}

export function getTopPlayersByChampion(
  players: any[],
): Record<string, string> {
  const topPlayers: Record<string, { nickname: string; score: number }> = {};
  for (const p of players) {
    const champ = p.champion;
    if (!topPlayers[champ] || p.score > topPlayers[champ].score) {
      topPlayers[champ] = { nickname: p.nickname, score: p.score };
    }
  }
  // 챔피언: 닉네임 형식으로 반환
  const result: Record<string, string> = {};
  for (const champ of Object.keys(topPlayers)) {
    result[champ] = topPlayers[champ].nickname;
  }
  return result;
}

export function compareRankings(prev: any[], curr: any[]): any[] {
  // 이전 플레이어 정보 맵: nickname -> (rank, score)
  const prevMap: Record<string, [number, number]> = {};
  prev.forEach((p, i) => {
    prevMap[p.nickname] = [i + 1, p.score];
  });
  const result = [];
  for (let i = 0; i < curr.length; i++) {
    const player = curr[i];
    const curRank = i + 1;
    const nickname = player.nickname;
    const score = player.score;
    const champion = player.champion ?? '-';
    if (!(nickname in prevMap)) {
      result.push({
        rank: curRank,
        nickname,
        champion,
        score,
        rank_change: 'new',
        score_change: null,
      });
    } else {
      const [prevRank, prevScore] = prevMap[nickname];
      result.push({
        rank: curRank,
        nickname,
        champion,
        score,
        rank_change: prevRank - curRank,
        score_change: score - prevScore,
      });
    }
  }
  return result;
}

export function shouldBackupBasedOnTime(lastBackupStr: string): boolean {
  // 오늘 00:00(KST) 이후 처음 실행이면 true, 이미 했으면 false
  const now = DateTime.now().setZone('Asia/Seoul');
  if (!lastBackupStr || lastBackupStr === '없음') return true;
  try {
    const lastBackup = DateTime.fromFormat(
      lastBackupStr,
      'yyyy-MM-dd HH:mm:ss',
      { zone: 'Asia/Seoul' },
    );
    if (!lastBackup.isValid) return true;
    const todayStart = now.startOf('day');
    return lastBackup < todayStart;
  } catch {
    return true;
  }
}
