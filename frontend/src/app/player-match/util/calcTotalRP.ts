/**
 * 기준 RP와 delta(증감) 배열을 받아 각 경기별 누적 RP(totalRP)를 계산
 * @param records matchRecords (최신순)
 * @param baseRP 기준 RP (stats.rankPoint)
 * @returns totalRP가 추가된 records (원본 순서 유지)
 *
 * delta 필드는 API 구조에 따라 rankDelta 또는 deltaRP 중 하나를 사용
 * 예외 발생 시 로그 출력 및 0 처리
 */
export function calcTotalRP(records: any[], baseRP: number | string, mode?: string) {
  // 1) baseRP에서 콤마 제거하고 숫자로 변환
  let pt = Number(String(baseRP).replace(/,/g, ""));
  if (isNaN(pt)) {
    console.warn("[WARN] baseRP 숫자 변환 실패:", baseRP);
    pt = 0;
  }

  // 2) records가 배열 아니면 빈 배열 반환
  if (!Array.isArray(records)) return [];

  // 3) 역순 복사: 오래된 경기부터 계산하기 위해
  const revRecs = [...records].reverse();

  // 4) 역순 순회하며 누적 RP 리스트 생성
  const rpList: number[] = [];
  revRecs.forEach((rec, idx) => {
    // delta 계산: rec.delta 또는 rec.rankDelta
    let delta = 0;
    if (rec.delta != null) {
      delta = Number(String(rec.delta).replace(/,/g, ""));
    } else if (rec.rankDelta != null) {
      const cleaned = String(rec.rankDelta)
        .replace(/,/g, "")
        .replace(/[^\d-]/g, "");
      delta = Number(cleaned);
      if (isNaN(delta)) delta = 0;
      if (String(rec.rankDelta).trim().startsWith("-")) {
        delta = -Math.abs(delta);
      }
    }

    // 디버그 로그
    if (mode) {
      console.log(`[RP_DEBUG] ${mode} revIdx=${idx} pt=${pt} delta=${delta}`);
    }

    // 현재 pt를 리스트에 저장하고, 다음 pt 계산
    rpList.push(pt);
    pt -= delta;
  });

  // 5) 원본 순서대로 map 하되, RP 값은 rpList 의 뒤에서부터 꺼내 붙임
  return records.map((rec, idx) => {
    // rpList 에서 원본 idx에 대응하는 위치: length-1-idx
    const totalRP = rpList[rpList.length - 1 - idx] ?? 0;

    // 원본 rec 그대로 복사 + totalRP 필드 추가
    return {
      ...rec,
      totalRP,
    };
  });
}
