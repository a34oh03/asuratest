"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PlayerMatchTabs, { TabType } from "./PlayerMatchTabs";

import PlayerProfile from "./PlayerProfile";
import { calcTotalRP } from './util/calcTotalRP';
import { t, Locale } from "./i18n";
import CachedImageWithFallback from "../utils/CachedImageWithFallback";
import ChampionPieChart from "./ChampionPieChart";
import {
  fetchPlayerMatchStats,
  fetchPlayerMatchRecord,
} from "./api";
import { Console } from "console";

interface StatsData {
  brSoloStats: any;
  brTrioStats: any;
  tagMatchStats: any;
  mostPlayedChampType?: string;
  mostPlayedChampName?: string;
  // playedChamps는 각 stats 내부에 존재
}
interface RecordData {
  nickname: string;
  passLevel: number;
  matchRecords: any[];
  summary?: any; // 최근 경기 요약
  champSummary?: any[]; // 캐릭터별 요약
}

const locale: Locale = "ko"; // TODO: 다국어 전환 로직 연동

export default function PlayerMatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // 닉네임 상태 및 입력값 상태 관리
    // error 상태를 ReactNode로 선언합니다.
  const [nickname, setNickname] = useState<string>("");
  const [searchNickname, setSearchNickname] = useState<string>("");
  const [tab, setTab] = useState<TabType>("all");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReactNode>("");

  // 최초 진입 시 쿼리스트링(viewNickname) 반영
  useEffect(() => {
    const qNickname = searchParams.get("viewNickname") || "";
    if (qNickname && qNickname !== nickname) {
      setNickname(qNickname);
      setSearchNickname(qNickname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 닉네임 검색 핸들러
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      setStats(null);
      setRecord(null);
      return;
    }
    // URL도 갱신
    router.push(`/player-match?viewNickname=${encodeURIComponent(nickname.trim())}`);
    setSearchNickname(nickname.trim());
  };

  // 엔터 입력 시 검색
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  useEffect(() => {
    if (!searchNickname) {
      setStats(null);
      setRecord(null);
      setError("닉네임을 입력해주세요.");
      return;
    }
    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const statsResp  = await fetchPlayerMatchStats(searchNickname);
        const recordResp = await fetchPlayerMatchRecord(searchNickname);
        setStats(statsResp);
        setRecord(recordResp);
      } catch (e: any) {
        console.error("fetchData 에러:", e);

        setStats(null);
        setRecord(null);

        const msg = e.message as string;

        if (msg.includes("404")) {
          setError(
            <div className="flex flex-col items-center space-y-4">
              <CachedImageWithFallback
                src="/static/error_image.png"
                fallback="/champion/default.png"
                alt="존재하지 않는 닉네임"
                className="w-45 h-45"
              />
              <span>존재하지 않는 닉네임입니다.</span>
            </div>
          );
        } else if (msg.includes("401")) {
          // 이미지 + 문구 + 하이퍼링크 조합 JSX
          setError(
            <div className="flex flex-col items-center space-y-4">
              <img
                src="/static/rate_limit.png"
                alt="세션 만료"
                className="w-45 h-45"
              />
              <span>주인장 세션이 만료되어서 못봐요.</span>
              <a
                href="https://gall.dcinside.com/asurajang/11788"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                https://gall.dcinside.com/asurajang/11788
              </a>
            </div>
          );
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchNickname])

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* 상단 네비게이션: 랭킹으로 이동 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <a
          href="/ranking"
          className="bg-gray-100 hover:bg-gray-200 text-blue-600 font-semibold px-4 py-1 rounded shadow border border-gray-300 transition-colors duration-150"
          aria-label="랭킹 페이지로 이동"
        >
          ← 랭킹으로
        </a>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            className="border px-3 py-1 rounded shadow-sm focus:outline-none"
            placeholder="닉네임 검색"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label="닉네임 검색"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
          >검색</button>
        </form>
      </div>
      {record && stats && !error && (
        <PlayerProfile 
          nickname={record.nickname} 
          passLevel={record.passLevel}
          mostPlayedChampType={stats.mostPlayedChampType}
          mostPlayedChampName={stats.mostPlayedChampName}
        />
      )}

      {/* 로딩 */}
      {loading && <div className="flex flex-col items-center py-8 text-gray-500 animate-pulse">
        <svg className="w-8 h-8 mb-2 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        {t(locale, 'loading')}
      </div>}
      {/* 에러 메시지 */}
      {error && (
        <div className="text-center text-black py-35">
          {error}
        </div>
      )}
      {/* 통계 & 전적 */}
      {!loading && !error && stats && record && (
        <>
        <AllStats
          stats={stats}
          record={record}
          locale={locale}
          mode={tab}
          setMode={setTab}
        />
        </>
      )}
    </div>
  );
}

interface AllStatsProps {
  stats: StatsData | null;
  record: RecordData | null;
  locale: Locale;
  mode: TabType;
  setMode: (mode: TabType) => void;
}

function AllStats({
  stats,
  record,
  locale,
  mode,
  setMode,
}: AllStatsProps) {
  // 데이터 유효성 검사
  if (!stats || !record) {
    return (
      <div className="p-4 bg-gray-100 rounded text-center">
        {t(locale, 'noData')}
      </div>
    );
  }

  // ===================================================================
  // 1) RP 계산 (솔로/트리오)
  // ===================================================================
  const soloBaseRP = stats.brSoloStats?.rankPoint ?? 0;
  const trioBaseRP = stats.brTrioStats?.rankPoint ?? 0;
  const teamDeathMatchBaseRP = 0;
  const tagMatchBaseRP = stats.tagMatchStats?.rankPoint ?? 9999;
  const soloRecords = (record.matchRecords ?? []).filter(
    r => Number(r.teamMode) === 1
  );
  console.log("soloRecords : ",soloRecords);
  const trioRecords = (record.matchRecords ?? []).filter(
    r => Number(r.teamMode) === 2 &&
         Number(r.matchMode) === 1
  );
  const teamDeathMatchRecords = (record.matchRecords ?? []).filter(
    r => Number(r.teamMode) === 2 && 
         Number(r.matchMode) === 2
  );
  const tagMatchRecords = (record.matchRecords ?? []).filter(
    r => Number(r.teamMode) === 2 && 
         Number(r.matchMode) === 4
  );
  const allRecords = [...soloRecords, ...trioRecords, ...teamDeathMatchRecords]
  .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  function getChampSummary(records: any[]) {
    interface Entry {
      champName: string;
      games: number;
      rankCount: number;    // rank>0인 경기 수
      sumRank: number;      // rank>0인 등수 합계
      winCount: number;     // rank===1인 경기 수
      top3Count: number;    // rank<=3인 경기 수
      sumTK: number;
      sumDmgPut: number;
      sumDmgGot: number;
      sumScore: number;
    }
  
    const map = new Map<string, Entry>();
  
    records.forEach(r => {
      const name = r.champName || r.champ || 'Unknown';
      // 원본이 문자열 콤마 포함 숫자라면 파싱
      const rank = parseInt(String(r.rank), 10) || 0;
      const tk   = parseInt(String(r.teamsKill).replace(/,/g, ''), 10) || 0;
      const put  = parseInt(String(r.dmgPut).replace(/,/g, ''), 10) || 0;
      const got  = parseInt(String(r.dmgGot).replace(/,/g, ''), 10) || 0;
      const score= Number(r.delta) || 0;
  
      let e = map.get(name);
      if (!e) {
        e = {
          champName: name,
          games: 0,
          rankCount: 0,
          sumRank: 0,
          winCount: 0,
          top3Count: 0,
          sumTK: 0,
          sumDmgPut: 0,
          sumDmgGot: 0,
          sumScore: 0,
        };
        map.set(name, e);
      }
  
      e.games += 1;
  
      // rank>0인 경우만 rankCount, sumRank에 반영
      if (rank > 0) {
        e.rankCount += 1;
        e.sumRank   += rank;
  
        if (rank === 1) {
          e.winCount += 1;
          e.top3Count += 1; // 1등도 top3에 포함
        } else if (rank <= 3) {
          e.top3Count += 1;
        }
      }
  
      e.sumTK     += tk;
      e.sumDmgPut += put;
      e.sumDmgGot += got;
      e.sumScore  += score;
    });
  
    // 엔트리를 배열로 변환, games 내림차순 정렬 후 평균 계산
    return Array.from(map.values())
      .sort((a, b) => b.games - a.games)
      .map(e => ({
        champName: e.champName,
        games: e.games,
        winCount: e.winCount,
        top3Count: e.top3Count,
        avgRank:  e.rankCount > 0 ? Number((e.sumRank / e.rankCount).toFixed(2)) : 0,
        avgTK:    Number((e.sumTK   / e.games).toFixed(2)),
        avgDmgPut: isNaN(e.sumDmgPut / e.games) ? '0' : Math.round(e.sumDmgPut / e.games).toLocaleString(),
        avgDmgGot: isNaN(e.sumDmgGot / e.games) ? '0' : Math.round(e.sumDmgGot / e.games).toLocaleString(),
        avgScore: e.games > 0 ? Number((e.sumScore / e.games).toFixed(2)) : 0,
      }));
  }

  const champSummaryByMode = 
    mode === 'solo'
      ? getChampSummary(soloRecords)
      : mode === 'trio'
      ? getChampSummary(trioRecords)
      : mode === 'teamDeathMatch'
      ? getChampSummary(teamDeathMatchRecords)
      : mode === 'tagMatch'
      ? getChampSummary(tagMatchRecords)
      : getChampSummary(allRecords)
  const soloWithRP = calcTotalRP(soloRecords, soloBaseRP).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const trioWithRP = calcTotalRP(trioRecords, trioBaseRP).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const teamDeathMatchWithRP = calcTotalRP(teamDeathMatchRecords, teamDeathMatchBaseRP).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const tagMatchWithRP = calcTotalRP(tagMatchRecords, tagMatchBaseRP).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  // 전체(솔로+트리오)를 모아서 시간 내림차순 정렬 → 최근 20개
  const allWithRP = [...soloWithRP, ...trioWithRP, ...teamDeathMatchWithRP, ...tagMatchWithRP]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // ===================================================================
  // 2) 프론트엔드용 '최근 N경기 요약' 헬퍼 함수
  //    백엔드의 summarizeRecentMatches와 동일 로직을 재구현
  // ===================================================================
  function getRecentSummary(recordsArr: any[]) {
    // 1) 앞에서 n개 (최신순으로 정렬되어 있다고 가정)
    const recent = recordsArr
  
    // 헬퍼: 문자열 숫자 → number (콤마 제거)
    const toNum = (v: any) => {
      if (v == null) return 0;
      const s = String(v).replace(/,/g, '');
      const x = Number(s);
      return Number.isFinite(x) ? x : 0;
    };
  
    // 2) 등수(rank) 배열: parseInt 후 0 이상만
    const ranks = recent
      .map(r => {
        const v = parseInt(String(r.rank), 10);
        return Number.isNaN(v) ? null : v;
      })
      .filter((x): x is number => x !== null);

    // 2) 0등(강제 탈주) 개수 계산
    const zeroCount = ranks.filter(r => r === 0).length;
    // 3) 유효 등수 개수 (전체 경기수에서 0등 개수만큼 차감)
    const validCount = ranks.length - zeroCount;
    
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const totalRank = sum(ranks);

    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
    // 3) 기본 통계
    const avgRank = validCount > 0
      ? Number((totalRank / validCount).toFixed(2))
      : 0;
      
    const winCount = ranks.filter(r => r === 1).length;
    const top3Count = ranks.filter(r => r > 0 && r <= 3).length;
    console.log("ranks", ranks);
    // 4) TK(teamsKill) 평균
    const tks = recent.map(r => toNum(r.teamsKill));
    const avgTK = Number(avg(tks).toFixed(2));
  
    // 5) 입힌 피해량(dmgPut) 평균
    const dmgPuts = recent.map(r => toNum(r.dmgPut));
    const avgDmgPut = Math.round(avg(dmgPuts));
  
    // 6) 받은 피해량(dmgGot) 평균
    const dmgGots = recent.map(r => toNum(r.dmgGot));
    const avgDmgGot = Math.round(avg(dmgGots));

    const champName = recent.map(r => r.champName || r.champ || 'Unknown');
    return {
      recentRanks: ranks,    // 렌더링 시 .slice().reverse() 로 순서 반전
      avgRank,               // 소수점 2자리까지
      winCount,              
      top3Count,             
      avgTK,                 
      avgDmgPut,             
      avgDmgGot,  
      champName,           
    };
  }

  // ===================================================================
  // 3) mode 에 따라 요약 데이터 선택
  //    - 'solo', 'trio' 모드는 헬퍼 함수 사용
  //    - 'all' 모드는 백엔드에서 온 record.summary 사용
  // ===================================================================

  const summaryData =
    mode === 'solo'
      ? getRecentSummary(soloRecords)
      : mode === 'trio'
      ? getRecentSummary(trioRecords)
      : mode === 'teamDeathMatch'
      ? getRecentSummary(teamDeathMatchRecords)
      : mode === 'tagMatch'
      ? getRecentSummary(tagMatchRecords)
      : getRecentSummary(allRecords)

  // 화면에 뿌릴 statsArr, recentRanks
  const statsArr = [
    { label: '평균 TK', value: summaryData?.avgTK ?? '-' },
    { label: '평정 횟수', value: summaryData?.winCount ?? '-' },
    { label: 'TOP 3', value: summaryData?.top3Count ?? '-' },
    { label: '평균 등수', value: summaryData?.avgRank ?? '-' },
    {
      label: '평균 피해량',
      value: summaryData?.avgDmgPut?.toLocaleString() ?? '-',
    },
    {
      label: '평균 받은 피해량',
      value: summaryData?.avgDmgGot?.toLocaleString() ?? '-',
    },
  ];
  const recentRanks: number[] = summaryData?.recentRanks ?? [];

  // ===================================================================
  // 4) 보여줄 전적 배열 결정
  // ===================================================================
  const recordsToShow =
    mode === 'solo'
      ? soloWithRP
      : mode === 'trio'
      ? trioWithRP
      : mode === 'teamDeathMatch'
      ? teamDeathMatchWithRP
      : mode === 'tagMatch'
      ? tagMatchWithRP
      : allWithRP;

  // ===================================================================
  // 5) 순위 박스 색상 함수 (1~3등 강조)
  // ===================================================================
  const boxClass = (n: number) => {
    if (n === 1) return 'bg-yellow-200';
    if (n === 2) return 'bg-blue-200';
    if (n === 3) return 'bg-red-200';
    return 'bg-gray-100';
  };

  // ===================================================================
  // 6) JSX 렌더링
  // ===================================================================
  return (
    <div>
      {/* 버튼 */}
      <PlayerMatchTabs current={mode} onChange={setMode} />
      {/* 상세 패널 */}
      <div className="border border-black rounded-lg p-6 bg-white space-y-6">
        {/* 최근 경기 요약 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            최근 경기 요약
          </h2>
          <div className="flex justify-between text-center text-sm">
            {statsArr.map((s, i) => (
              <div key={i} className="flex-1">
                <div>{s.label}</div>
                <div className="font-bold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 순위 박스 */}
        <div className="flex flex-wrap justify-center gap-2">
          {recentRanks.slice().reverse().map((id, i) => (
            <div
              key={i}
              className={`w-8 h-8 flex items-center justify-center border rounded ${boxClass(
                id
              )} font-medium`}
            >
              {id}
            </div>
          ))}
        </div>

        {/* 캐릭터별 요약 테이블 */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">챔피언</th>
                {['평균 TK', '평정 횟수', 'TOP 3', '평균 등수', '평균 입힌 피해량', '평균 받은 피해량', '평균 획득 점수'].map((lbl, i) => (
                  <th key={i} className="p-2 text-center">{lbl}</th>
                ))}
              </tr>
            </thead>
            <tbody>
               {champSummaryByMode.length > 0 ? champSummaryByMode.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 flex items-center space-x-2">
                    <CachedImageWithFallback
                      src={`/champion/${row.champName}.png`}
                      fallback="/champion/default.png"
                      alt={row.champName}
                      className="w-8 h-8 rounded-full border"
                    />
                    <span>{row.champName} ({row.games}회)</span>
                  </td>
                  {[row.avgTK, row.winCount, row.top3Count, row.avgRank, row.avgDmgPut, row.avgDmgGot, row.avgScore].map((val, j) => (
                    <td key={j} className="p-2 text-center font-semibold">{val}</td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    캐릭터별 요약 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="border border-black rounded-lg p-6 bg-white space-y-6 mt-4">
        {/* 최근 전적 리스트 */}
        <div className="pt-6">
          <h2 className="text-lg font-semibold mb-4">
            {mode === 'all'
              ? '최근 20경기'
              : mode === 'solo'
              ? '솔로 모드'
              : mode === 'trio'
              ? '트리오 모드'
              : mode === 'teamDeathMatch'
              ? '팀 데스매치'
              : mode === 'tagMatch'
              ? '태그매치'
              : '전체 모드'
              
              }

          </h2>
          <MatchRecordsBlockList
            records={recordsToShow}
            locale={locale}
          />
        </div>
      </div>
      {/* 요약 블록 */}
      {mode === 'all' ? (
        <div className="flex flex-col md:flex-row gap-4 mb-6">

          <div className="flex-1 min-w-[240px] mt-4">
            <StatsBlock
              title="태그매치 요약"
              stats={stats.tagMatchStats}
              locale={locale}
            />
  {/*        <div className="flex-1 min-w-[240px] mt-4">
            <StatsBlock
              title="솔로 요약"
              stats={stats.brSoloStats}
              locale={locale}
            />
          </div>*/}
          <div className="flex-1 min-w-[240px] mt-4">
            <StatsBlock
              title="트리오 요약"
              stats={stats.brTrioStats}
              locale={locale}
            />
          </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <StatsBlock
            title={mode === 'solo' ? '솔로 요약' : mode === 'trio' ? '트리오 요약' : mode === 'tagMatch' ? '태그매치 요약' : '전체 요약'}
            stats={
              mode === 'solo'
                ? stats.brSoloStats!
                : mode === 'trio'
                ? stats.brTrioStats!
                : mode === 'tagMatch'
                ? stats.tagMatchStats!
                : stats.brSoloStats!
            }
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}




function StatsBlock({ title, stats, locale }: { title: string, stats: any, locale: Locale }) {
  if (!stats) return <div className="p-4 bg-gray-100 rounded">{t(locale, 'noData')}</div>;
  return (
    <div className="p-4 bg-white rounded shadow border">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>RP</div><div>{stats.rankPoint}</div>
        <div>순위</div><div>{stats.rankPosition}</div>
        <div>경기수</div><div>{stats.matches}</div>
        <div>1등</div><div>{stats.firstRanks}</div>
        <div>Top</div><div>{stats.topRanks}</div>
        <div>킬</div><div>{stats.kills}</div>
        <div>평균킬</div><div>{stats.avgKill}</div>
        <div>평균딜</div><div>{stats.avgDamagePut}</div>
        <div>지옥탈출</div><div>{stats.purgatoryEscapes}</div>
      </div>
      <div className="mt-2">
        <div className="font-semibold">플레이 챔피언</div>
        {(() => {
          const sortedChamps = stats.playedChamps
            ?.slice()
            .sort((a: any, b: any) => b.matches - a.matches) || [];
          return (
            <>
              {/* 3) 파이차트에도 같은 배열 사용 */}
              {sortedChamps.length > 0 && (
                <div className="mt-4">
                  <ChampionPieChart playedChamps={sortedChamps} />
                </div>
              )}

              {/* 2) 순서대로 렌더링 */}
              <div className="flex flex-wrap justify-center gap-2 mt-7">
                {sortedChamps.map((ch: any, i: number) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs"
                  >
                    <CachedImageWithFallback
                      src={`/champion/${ch.champName}.png`}
                      fallback="/champion/default.png"
                      alt={ch.champName}
                      className="w-5 h-5 inline-block rounded"
                    />
                    {ch.champName} ({ch.matches}경기, Top {ch.topRanks})
                  </span>
                ))}
              </div>


            </>
          );
        })()}

      </div>

    </div>
  );
}

function MatchRecordsBlockList({
  records,
  locale,
}: {
  records: any[];
  locale: Locale;
}) {
  if (!records?.length) {
    return (
      <div className="p-4 bg-gray-100 rounded text-center">
        {t(locale, 'noRecord')}
      </div>
    );
  }

  return (
    <div className="my-6 space-y-4 ">
      {records.map((rec, idx) => {
        const rankNum = Number(rec.rank);

        // 왼쪽 컬러 바 설정 
        let leftColor = "border-l-8 border-l-gray-400";       // 기본
        if (rankNum === 1)      leftColor = "border-l-8 border-l-yellow-300";
        else if (rankNum === 2) leftColor = "border-l-8 border-l-blue-400";
        else if (rankNum === 3) leftColor = "border-l-8 border-l-red-400";

        return (
          <div
            key={`${rec.rank}-${idx}`}
            className={`
              relative flex items-center space-x-6 bg-white rounded-lg p-4
              shadow-sm
              border-1 border-gray-300      /* ← 전체 테두리 진하게 */
              ${leftColor}              /* ← 왼쪽 컬러 바 */
            `}
          >
            {/* 1) 순위 · 모드 · 시간 블록 */}
            <div className="flex flex-col text-sm w-25 flex-none">
              <span className="font-bold text-lg">#{rankNum}</span>
              <span>{rec.mode}</span>
              <span className="text-gray-500">{rec.playTime}</span>
              <span className="text-gray-500">{rec.elapsed}</span>
            </div>


            {/* 2) 챔피언 이미지 영역 */}
            {rec.mode === '배틀로얄 - 솔로' ? (
              // 솔로 모드: 단일 이미지
              <div className="w-20 h-20 rounded-full border border-gray-400 overflow-hidden flex-shrink-0">
                <CachedImageWithFallback
                  src={`/champion/${rec.champ}.png`}
                  fallback="/champion/default.png"
                  alt={rec.champ}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (rec.mode === '배틀로얄 - 트리오' || rec.mode === '팀 데스매치' || rec.mode === '태그매치') ? (
              // 트리오 모드: 메인 + 아군 2명
              <div className="flex items-center flex-shrink-0">
                {/* 메인 챔피언 */}
                <div className="w-20 h-20 rounded-full border border-gray-400 overflow-hidden">
                  <CachedImageWithFallback
                    src={`/champion/${rec.champ}.png`}
                    fallback="/champion/default.png"
                    alt={rec.champ}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 아군 2명: 작은 원형 이미지 위아래 */}
                <div className="flex flex-col ml-2 space-y-1">
                  <div className="w-8 h-8 rounded-full border border-gray-400 overflow-hidden">
                    <CachedImageWithFallback
                      src={`/champion/${rec.allyChampType1}.png`}
                      fallback="/champion/default.png"
                      alt={rec.allyChampType1}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-400 overflow-hidden">
                    <CachedImageWithFallback
                      src={`/champion/${rec.allyChampType2}.png`}
                      fallback="/champion/default.png"
                      alt={rec.allyChampType2}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              null
            )}

            {/* 3) 중앙 정보 그리드 */}
            <div className="flex-1 grid grid-cols-4 gap-x-4 text-sm items-center">
              <div className="flex flex-col items-center">
                <span className="font-semibold">
                  {rec.teamsKill} / {rec.myKill} / {rec.assists}
                </span>
                <span className="text-xs text-gray-500">TK / K / A</span>
              </div>

                <div className="flex flex-col items-center">
                      <span className="flex items-baseline">
                        <span className="font-semibold">
                          {Number(rec.totalRP).toLocaleString()}
                        </span>
                        {rec.delta !== 0 && (
                        <span
                          className={`ml-1 font-bold ${
                            rec.delta < 0 ? 'text-blue-600' : 'text-red-600'
                          }`}
                        >
                          {rec.delta < 0
                            ? `(${rec.delta})`
                            : `(+${rec.delta})`}
                        </span>
                      )}
                      </span>

                        {rec.rpLabel ? (
                          <span className="text-xs text-gray-500">{rec.rpLabel}</span>
                        ) : (
                          <span className="text-xs text-gray-500">MMR: {rec.mmr}</span>
                        )}
                </div>
              
              <div className="flex flex-col items-center">
                <span className="font-semibold">
                  {(rec.dmgPut).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">입힌 피해량</span>
              </div>
               {/* 받은 피해량 */}
            <div className="flex flex-col items-center">
              <span className="font-semibold">
                {(rec.dmgGot).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">받은 피해량</span>
            </div>
            </div>

            
            {/* 4) 장비 슬롯 */}
            {rec.mode !== '팀 데스매치' && rec.mode !== '태그매치' ? (
              rec.items ? (
                <div className="grid grid-cols-3 gap-1">
                  {(() => {
                    const names = rec.items.split(',').map((s: string) => s.trim());
                    const levels = rec.astra.split(',').map((s: string) => s.trim());
                    const len = Math.min(names.length, levels.length);
                    return names.slice(0, len).map((name: string, i: number) => {
                      const level = levels[i];
                      return (
                        <div
                          key={i}
                          className="relative w-12 h-12 border border-gray-300 overflow-hidden rounded"
                        >
                          <CachedImageWithFallback
                            src={`/item/${name}.png`}
                            fallback="/item/default.png"
                            alt={name}
                            className="w-full h-full object-contain"
                          />
                          <span className="
                            absolute bottom-0 right-0
                            bg-black bg-opacity-50
                            text-yellow-300 text-[10px] font-bold
                            px-0.5
                          ">
                            {level}↑
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
                ) : (
                <div className="text-xs text-gray-400">장비 정보 없음</div>
                )
             ) : null}
          </div>
        );
      })}
    </div>
  );
}