// src/app/player-match/api/playerMatchApi.ts

export async function fetchPlayerMatchStats(viewNickname: string) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    const url = `${base}/player-match/match-stats?viewNickname=${encodeURIComponent(viewNickname)}`;
    console.log("fetchPlayerMatchStats 요청 URL:", url);

    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      console.error("Stats API 오류:", resp.status, body);
      throw new Error(`매치 스탯 API 실패: ${resp.status}`);
    }

    return await resp.json();
  } catch (e) {
    console.error("fetchPlayerMatchStats error", e);
    return null;
  }
}

export async function fetchPlayerMatchRecord(viewNickname: string) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    const url = `${base}/player-match/match-record?viewNickname=${encodeURIComponent(viewNickname)}`;
    console.log("fetchPlayerMatchRecord 요청 URL:", url);

    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      console.error("Record API 오류:", resp.status, body);
      throw new Error(`매치 기록 API 실패: ${resp.status}`);
    }

    return await resp.json();
  } catch (e) {
    console.error("fetchPlayerMatchRecord error", e);
    return null;
  }
}
