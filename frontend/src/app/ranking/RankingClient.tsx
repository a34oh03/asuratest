'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RankingSummary } from './types';
import RankingTable from './RankingTable';
import ChampionBarChart from './ChampionBarChart';
import PlayerSearchBar from './PlayerSearchBar';
import { fetchRankingSummary } from './services/rankingService';
import RankingRateLimit from './RateLimit';
import RankingError from './RankingError';
import CachedImageWithFallback from "../utils/CachedImageWithFallback";

export default function RankingClient() {
  const fetched = useRef(false);

  const [mode, setMode] = useState<'solo' | 'trio'>('solo');
  const [data, setData] = useState<RankingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터를 불러오는 함수
  const reloadData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchRankingSummary()
      .then(res => setData(res))
      .catch(e => {
        if (e.message === 'rate-limit') setError('429');
        else if (e.message === 'bad-request') setError('400');
        else setError('generic');
      })
      .finally(() => setLoading(false));
  }, []);

  // 최초 마운트 시 한 번만 데이터 로드
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    reloadData();
  }, [reloadData]);

  // F5 키 가로채기: 기본 새로고침 대신 reloadData 만 호출
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        reloadData();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [reloadData]);

  // 에러 처리
  if (error === '429') return <RankingRateLimit />;
  if (error) return <RankingError />;

  // **data가 아직 없고** loading인 경우에만 빈 화면 + 스피너
  if (data === null && loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CachedImageWithFallback
          src="/static/loading.png"
          fallback="/champion/default.png"
          alt="로딩중.."
          className="w-20 h-20 animate-spin"
        />
      </div>
    );
  }

  // data가 전혀 없는데 loading도 false라면 에러
  if (data === null) {
    return <RankingError />;
  }

  // 이제 메인 UI는 항상 렌더
  const now = data.now_time;
  const last = data.last_backup;

  return (
    <div className="max-w-5xl mx-auto p-4 relative min-h-screen">
      {/* ▶ 검색바는 그대로 */}
      <div className="flex justify-end mb-4">
        <PlayerSearchBar />
      </div>

      {/* 솔로/트리오 버튼 (UI 전환만) */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          className={`px-4 py-2 rounded shadow ${
            mode === 'solo' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setMode('solo')}
        >
          솔로
        </button>
        <button
          className={`px-4 py-2 rounded shadow ${
            mode === 'trio' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setMode('trio')}
        >
          트리오
        </button>
      </div>

      {/* 제목 + 업데이트 시간 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-left">
          Top 100 랭커 ({mode === 'solo' ? '솔로' : '트리오'})
        </h1>
        <div className="text-xs text-gray-400 text-left leading-tight">
          <div>이전 업데이트 시간: {last || '-'}</div>
          <div>최근 업데이트 시간: {now}</div>
        </div>
      </div>

      {/* 랭킹 테이블 */}
      <RankingTable
        players={mode === 'solo' ? data.solo_players : data.trio_players}
        mode={mode}
      />

      {/* 챔피언 통계 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <ChampionBarChart
          labels={data.solo_stats.labels}
          counts={data.solo_stats.counts}
          title="자주 사용된 주 캐릭터 (솔로)"
        />
        <ChampionBarChart
          labels={data.trio_stats.labels}
          counts={data.trio_stats.counts}
          title="자주 사용된 주 캐릭터 (트리오)"
        />
      </div>

      <hr className="my-10 border-gray-300" />
      <p className="text-center text-xs text-gray-500 mt-8 mb-2">
        이 사이트는 비공식 팬사이트이며, 아수라장 공식 서비스와는 무관합니다.
        <br />
        모든 데이터는 본인 계정 또는 등록된 계정을 통해 수집되며, 단순 열람용으로 제공됩니다.
      </p>

      {/* ▶ F5로 호출된 reloadData 중에는 기존 UI 하단이 아닌
           “화면 왼쪽 상단”에 오버레이 스피너만 표시 */}
      {loading && data !== null && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-2 rounded">
          <CachedImageWithFallback
            src="/static/loading.png"
            fallback="/champion/default.png"
            alt="로딩중.."
            className="w-12 h-12 animate-spin"
          />
        </div>
      )}
    </div>
  );
}
