// src/app/player-match/api/playerMatchApi.ts
export async function fetchPlayerMatchStats(viewNickname: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000/api";
  const url = `/api/player-match/match-stats?viewNickname=${encodeURIComponent(
    viewNickname
  )}`;
  console.log("fetchPlayerMatchStats 요청 URL:", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text();
    console.error("Stats API 오류:", resp.status, body);
    // 상태 코드를 error 객체에 붙여서 던집니다
    const error = new Error(`매치 스탯 API 실패: ${resp.status}`);
    ;(error as any).status = resp.status;
    throw error;
  }

  // JSON 파싱 중 에러도 호출자에게 전파됩니다
  return await resp.json();
}

export async function fetchPlayerMatchRecord(viewNickname: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000/api";
  const url = `/api/player-match/match-record?viewNickname=${encodeURIComponent(
    viewNickname
  )}`;
  console.log("fetchPlayerMatchRecord 요청 URL:", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text();
    console.error("Record API 오류:", resp.status, body);
    const error = new Error(`매치 기록 API 실패: ${resp.status}`);
    ;(error as any).status = resp.status;
    throw error;
  }

  return await resp.json();
}

