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
  14: '브룬',
  15: '에린',
  17: '쇼요',
};

// 챔피언 ID와 플레이 횟수를 저장할 타입
export interface MostChamp {
  champId: number;
  playCount: number;
  name: string;  // ← 챔피언 이름 문자열 (매핑 필요)
}

// --- 타입 선언부 ---
export interface PlayerRaw {
  nickname?: string;
  score?: number | string;
  mostChamps: string; // <= 파싱 필요
  // iconDocKey, outfitFashion, titleDocKey 등
}



export interface PlayerSummary {
  rank: number;
  nickname: string;
  score: number;
  mostChamps: MostChamp[];
}

export interface ChampionStats {
  labels: string[];
  counts: number[];
}
// -----------------------


/**
 * playersRaw: API 로부터 받은 “원시” 플레이어 배열
 * 반환: PlayerSummary[] (랭킹 순서대로)
 */
export function parsePlayers(playersRaw: PlayerRaw[]): PlayerSummary[] {
  const players: PlayerSummary[] = [];  // ← 명시적 타입 지정

  playersRaw.forEach((p, idx) => {
    const nickname = typeof p.nickname === 'string' ? p.nickname : '알 수 없음';

    // score: 숫자 또는 숫자 문자열 → Number
    const rawScore = p.score ?? 0;
    const nScore = typeof rawScore === 'number' ? rawScore : Number(rawScore);
    const score  = Number.isFinite(nScore) ? nScore : 0;

    // mostChamps
    const rawMost = p.mostChamps ?? '';
    const mostChamps = parseMostChamps(rawMost);

    players.push({
      rank:     idx + 1,
      nickname,
      score,
      mostChamps,
    });
  });

  return players;
}


function parseMostChamps(raw: string): MostChamp[] {
  if (typeof raw !== 'string') return [];

  return raw.split('|').map(entry => {
    const [champStr, countStr] = entry.split(':');
    const champId = Number(champStr);
    const playCount = Number(countStr);

    return {
      champId,
      playCount,
      name: championMap[champId] ?? `알 수 없음(${champId})`,
    };
  }).filter(mc => Number.isFinite(mc.champId) && Number.isFinite(mc.playCount));
}

/**
 * playersRaw: API 로부터 받은 “원시” 플레이어 배열
 * 반환: 챔피언별 사용 통계를 담은 객체
 */
/**
 * playersRaw: API 로부터 받은 “원시” 플레이어 배열
 * 반환: 챔피언별 사용 통계를 담은 객체 (대표 챔피언 하나만 반영)
 */
export function calculateChampionStats(playersRaw: PlayerRaw[]): ChampionStats {
  const counter: Record<number, number> = {};

  playersRaw.forEach(p => {
    const rawMost = p.mostChamps ?? '';
    const mostList = parseMostChamps(rawMost);

    const mainChamp = mostList[0]; // 첫 번째만 사용
    if (mainChamp) {
      counter[mainChamp.champId] = (counter[mainChamp.champId] || 0) + 1;
    }
  });

  // 모든 챔피언을 포함하도록 초기화
  const fullStats: Record<number, number> = {};
  Object.keys(championMap).map(Number).forEach(cid => {
    fullStats[cid] = counter[cid] || 0;
  });

  // 내림차순 정렬
  const sorted = Object.entries(fullStats)
    .sort(([, a], [, b]) => b - a);

  const labels = sorted.map(([cid]) => 
    championMap[Number(cid)] ?? `알 수 없음(${cid})`
  );
  const counts = sorted.map(([, cnt]) => cnt);

  return { labels, counts };
}




export function getTopPlayersByChampion(
  players: any[],
): Record<string, string> {
  const topPlayers: Record<string, { nickname: string; score: number }> = {};
  for (const p of players) {
    const mainChamp = p.mostChamps[0]?.name ?? '알 수 없음';
    if (!topPlayers[mainChamp] || p.score > topPlayers[mainChamp].score) {
      topPlayers[mainChamp] = { nickname: p.nickname, score: p.score };
    }
  }
  // 챔피언: 닉네임 형식으로 반환
  const result: Record<string, string> = {};
  for (const champ of Object.keys(topPlayers)) {
    result[champ] = topPlayers[champ].nickname;
  }
  return result;
}


export function compareRankings(prev: any[] = [], curr: any[] = []): any[] {
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
    const nickname_raw = player.nickname;
    const score = player.score;
    const mostChamps = player.mostChamps
    const champion = mostChamps[0]?.name ?? '-';
    if (!(nickname in prevMap)) {
      result.push({
        rank: curRank,
        nickname,
        nickname_raw,
        mostChamps,
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
        nickname_raw,
        mostChamps,
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
