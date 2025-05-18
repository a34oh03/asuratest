"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PlayerMatchTabs, { TabType } from "./PlayerMatchTabs";

import PlayerProfile from "./PlayerProfile";
import { calcTotalRP } from './util/calcTotalRP';
import { t, Locale } from "./i18n";
import ImageWithFallback from "./ImageWithFallback";
import ChampionPieChart from "./ChampionPieChart";
import {
  fetchPlayerMatchStats,
  fetchPlayerMatchRecord,
} from "./api";
// 유틸 함수 import 제거 (백엔드에서 가공된 값만 사용)

interface StatsData {
  brSoloStats: any;
  brTrioStats: any;
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
  const [nickname, setNickname] = useState<string>("");
  const [searchNickname, setSearchNickname] = useState<string>("");
  const [tab, setTab] = useState<TabType>("all");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
        const statsResp = await fetchPlayerMatchStats(searchNickname);
        const recordResp = await fetchPlayerMatchRecord(searchNickname);
        if (!statsResp || !recordResp) {
          setStats(null);
          setRecord(null);
          setError("존재하지 않는 닉네임이거나 데이터를 찾을 수 없습니다.");
          return;
        }
        setStats(statsResp);
        setRecord(recordResp);
      } catch (e: any) {
        setStats(null);
        setRecord(null);
        setError(e?.message || "데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchNickname]);

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
      <PlayerMatchTabs current={tab} onChange={setTab} />
      {loading && <div className="flex flex-col items-center py-8 text-gray-500 animate-pulse">
        <svg className="w-8 h-8 mb-2 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        {t(locale, 'loading')}
      </div>}
      {error && <div className="text-center text-red-500 py-6">
        <span className="font-bold">⚠</span> {error}
      </div>}
      {!loading && !error && stats && record && (
        <>
          {tab === "all" && (
            <AllStats stats={stats} record={record} locale={locale} />
          )}
          {tab === "solo" && (
            <SoloStats stats={stats?.brSoloStats} record={record} locale={locale} />
          )}
          {tab === "trio" && (
            <TrioStats stats={stats?.brTrioStats} record={record} locale={locale} />
          )}
        </>
      )}
    </div>
  );
}

function AllStats({ stats, record, locale }: { stats: StatsData | null, record: RecordData | null, locale: Locale }) {
  if (!stats || !record) return <div className="p-4 bg-gray-100 rounded">{t(locale, 'noData')}</div>;

  // 네모 박스 색상 함수 (1,2,3등 구분)
  const boxClass = (n: number) => {
    if (n === 1) return 'bg-yellow-200';
    if (n === 2) return 'bg-blue-200';
    if (n === 3) return 'bg-red-200';
    return 'bg-gray-100';
  };

  // 상단 요약 통계
  const statsArr = [
    { label: '평균 TK', value: record.summary?.avgTK ?? '-' },
    { label: '평정 횟수', value: record.summary?.winCount ?? '-' },
    { label: 'TOP 3', value: record.summary?.top3Count ?? '-' },
    { label: '평균 등수', value: record.summary?.avgRank ?? '-' },
    { label: '평균 피해량', value: record.summary?.avgDmgPut?.toLocaleString() ?? '-' },
    { label: '평균 받은 피해량', value: record.summary?.avgDmgGot?.toLocaleString() ?? '-' },
  ];

  // 캐릭터별 요약 라벨
  const labels = [
    '평균 TK',
    '평정 횟수',
    'TOP 3',
    '평균 등수',
    '평균 입힌 피해량',
    '평균 받은 피해량',
    '평균 획득 점수',
  ];

  // 캐릭터별 요약 값 추출 함수 (row)
  function champRowValues(row: any) {
    return [
      row.avgTK ?? '-',
      row.winCount ?? '-',
      row.top3Count ?? '-',
      row.avgRank ?? '-',
      row.avgDmgPut != null ? row.avgDmgPut.toLocaleString() : '-',
      row.avgDmgGot != null ? row.avgDmgGot.toLocaleString() : '-',
      row.avgScore ?? '-',
    ];
  }

  // 솔로/트리오 모드별 누적 RP 계산 (secure coding: 예외처리 및 주석)
  let soloRecordsWithRP: any[] = [];
  let trioRecordsWithRP: any[] = [];
  try {
    const soloBaseRP = stats?.brSoloStats?.rankPoint;
    // teamMode: 1=솔로, 2=트리오
    const soloRecords = record?.matchRecords?.filter(r => Number(r.teamMode) === 1) || [];
    console.log('[RP_DEBUG] soloBaseRP:', soloBaseRP);
    console.log('[RP_DEBUG] teamMode values:', record?.matchRecords?.map(r => r.teamMode));
    console.log('[RP_DEBUG] soloRecords:', soloRecords);
    soloRecordsWithRP = calcTotalRP(soloRecords, (soloBaseRP));
  } catch (e) {
    console.error('[page.tsx] 솔로 RP 계산 오류:', e);
    soloRecordsWithRP = [];
  }
  try {
    const trioBaseRP = stats?.brTrioStats?.rankPoint;
    const trioRecords = record?.matchRecords?.filter(r => Number(r.teamMode) === 2) || [];
    console.log('[RP_DEBUG] trioBaseRP:', trioBaseRP);
    console.log('[RP_DEBUG] teamMode values:', record?.matchRecords?.map(r => r.teamMode));
    console.log('[RP_DEBUG] trioRecords:', trioRecords);
    trioRecordsWithRP = calcTotalRP(trioRecords, (trioBaseRP));
  } catch (e) {
    console.error('[page.tsx] 트리오 RP 계산 오류:', e);
    trioRecordsWithRP = [];
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 전체/솔로/트리오 요약 블록 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 min-w-[240px]">
            <StatsBlock title="솔로 요약" stats={stats?.brSoloStats} locale={locale} />
          </div>
          <div className="flex-1 min-w-[240px]">
            <StatsBlock title="트리오 요약" stats={stats?.brTrioStats} locale={locale} />
          </div>
        </div>

        <div className="border border-black rounded-lg p-6 bg-white space-y-6">
          {/* 최근 경기 요약 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">최근 경기 요약</h2>
            <div className="flex justify-between text-center text-sm">
              {statsArr.map((s) => (
                <div key={s.label} className="flex-1">
                  <div>{s.label}</div>
                  <div className="font-bold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 네모 박스 스트립 */}
          <div className="flex flex-wrap gap-2">
            {record.summary?.recentRanks?.map((id: number, idx: number) => (
              <div
                key={idx}
                className={`w-8 h-8 flex items-center justify-center border rounded ${boxClass(id)} font-medium`}
              >
                {id}
              </div>
            ))}
          </div>
          {/* 캐릭터별 2줄 요약 */}
          <div className="space-y-6 text-sm">
            <div className="border border-black rounded-lg p-6 bg-white space-y-6">
              {Array.isArray(record?.champSummary) && record.champSummary.length > 0 ? (
                record.champSummary.map((row: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-4">
                    {/* 캐릭터 이미지 + 플레이 횟수 */}
                    <div className="flex flex-col items-center flex-shrink-0 text-xs text-center">
                      {/* 1) 이미지 래퍼만 overflow-hidden */}
                      <div className="w-13 h-13 rounded-full border overflow-hidden">
                        <img
                          src={`/champion/${row.champName}.png`}
                          alt={row.champName}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/champion/default.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* 2) 이미지 밖, 래퍼 아래에 플레이 횟수 */}
                      <span className="text-[10px] text-gray-500 mt-1">
                        {row.games ? `${row.games}회` : '-'}
                      </span>
                    </div>

                    {/* grid: 7열 */}
                    <div className="grid grid-cols-7 flex-1 min-w-max">
                      {labels.map(label => (
                        <div
                          key={label}
                          className="border-b pb-1 text-xs text-center"
                        >
                          {label}
                        </div>
                      ))}
                      {champRowValues(row).map((val, i) => (
                        <div
                          key={i}
                          className="pt-1 font-semibold text-center"
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-100 rounded mb-6">
                  캐릭터별 요약 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 최근 20경기 상세 */}
          <div className="pt-6">
            <h2 className="text-lg font-semibold mb-4">최근 20경기 상세</h2>
            {/* 솔로 모드 */}
            <h3 className="font-bold text-lg mb-2">솔로 모드</h3>
            <MatchRecordsBlockList records={soloRecordsWithRP} locale={locale} />
            {/* 트리오 모드 */}
            <h3 className="font-bold text-lg mt-4 mb-2">트리오 모드</h3>
            <MatchRecordsBlockList records={trioRecordsWithRP} locale={locale} />
          </div>
        </div>
      </div>
    </main>
  );
}


function SoloStats({ stats, record, locale }: { stats: any, record: RecordData | null, locale: Locale }) {
  // 3번 이미지: 솔로 전적만
  if (!stats) return <div className="p-4 bg-gray-100 rounded">{t(locale, 'noData')}</div>;
  return (
    <div>
      <StatsBlock title={t(locale, 'solo')} stats={stats} locale={locale} />
      <h2 className="font-bold text-xl mt-6 mb-2">{t(locale, 'recentMatches')}</h2>
      <MatchRecordsBlockList records={record?.matchRecords?.filter(r => r.mode === 'solo') ?? []} locale={locale} />
    </div>
  );
}

function TrioStats({ stats, record, locale }: { stats: any, record: RecordData | null, locale: Locale }) {
  // 4번 이미지: 트리오 전적만
  if (!stats) return <div className="p-4 bg-gray-100 rounded">{t(locale, 'noData')}</div>;
  return (
    <div>
      <StatsBlock title={t(locale, 'trio')} stats={stats} locale={locale} />
      <h2 className="font-bold text-xl mt-6 mb-2">{t(locale, 'recentMatches')}</h2>
      <MatchRecordsBlockList records={record?.matchRecords?.filter(r => r.mode === 'trio') ?? []} locale={locale} />
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
        <div>MMR</div><div>{stats.mmrLabel}</div>
        <div>평균딜</div><div>{stats.avgDamagePut}</div>
        <div>지옥탈출</div><div>{stats.purgatoryEscapes}</div>
      </div>
      <div className="mt-2">
        <div className="font-semibold">플레이 챔피언</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {stats.playedChamps?.map((ch: any, i: number) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs">
              <ImageWithFallback
                src={`/champion/${ch.champName}.png`}
                fallback="/champion/default.png"
                alt={ch.champName}
                className="w-5 h-5 inline-block rounded"
              />
              {ch.champName} ({ch.matches}경기, Top {ch.topRanks})
            </span>
          ))}
        </div>
        {/* 챔피언 통계 파이차트 시각화 */}
        {stats.playedChamps && stats.playedChamps.length > 0 && (
          <div className="mt-4">
            <ChampionPieChart playedChamps={stats.playedChamps} />
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRecordsBlockList({ records, locale }: { records: any[]; locale: Locale }) {
  if (!records?.length) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        {t(locale, 'noRecord')}
      </div>
    );
  }

  // 1) records 전체는 역순으로
  const reversedRecords = [...records].reverse();

  return (
    <div className="my-4">
      <div className="space-y-4">
        {reversedRecords.map((rec, idx) => (
          <div key={`${rec.rank}-${idx}`} className="border rounded-lg p-4 bg-white shadow-sm">
            {/* 상단 네모 박스 */}
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xl font-bold text-gray-700">
                #{Number(rec.rank) - 1}
              </div>
              <div className="font-semibold text-base text-blue-700">
                {rec.mode}
              </div>
              <div className="text-xs text-gray-500">
                {rec.time} ({rec.elapsed})
              </div>
              <div className="ml-auto text-sm text-gray-400">
                {rec.playTime}
              </div>
            </div>

            {/* 챔피언 이미지 및 이름 */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center min-w-[60px]">
                <ImageWithFallback
                  src={`/champion/${rec.champ}.png`}
                  fallback="/champion/default.png"
                  alt={rec.champ}
                  className="w-12 h-12 rounded-full border"
                />
                <span className="text-xs mt-1 text-gray-600">
                  {rec.champ}
                </span>
              </div>

              {/* 통계 그리드 */}
              <div className="flex-1 grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                <div><span className="font-bold">TK/K/A</span></div>
                <div><span className="font-bold">RP</span></div>
                <div><span className="font-bold">입힌 피해량</span></div>

                <div>
                  {rec.teamsKill} / {rec.myKill} / {rec.assists}
                </div>
                <div>
                  {/* 3) 역순된 레코드 idx 에, 원본 순서 RP[idx] 그대로 */}
                  <span className="font-semibold text-black">
                    {rec.totalRP}
                  </span>
                  <span
                    className={`${
                      typeof rec.delta === 'string' && rec.delta.startsWith('-')
                        ? 'text-blue-600 font-bold ml-1'
                        : 'text-red-600 font-bold ml-1'
                    }`}
                  >
                    ({rec.delta ?? '-'})
                  </span>
                </div>
                <div>{rec.dmgPut}</div>

                <div><span className="font-bold">받은 피해량</span></div>
                <div><span className="font-bold">MMR</span></div>
                <div><span className="font-bold">지역</span></div>

                <div>{rec.dmgGot}</div>
                <div>{rec.mmr}</div>
                <div>{rec.region}</div>
              </div>

              {/* 아이템 */}
              <div className="flex flex-col gap-1 ml-4 min-w-[80px]">
                {rec.items?.split(',').map((item: string, i: number) => (
                  <span
                    key={i}
                    className="border rounded px-2 py-0.5 text-xs bg-gray-50 text-gray-700 text-center"
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
