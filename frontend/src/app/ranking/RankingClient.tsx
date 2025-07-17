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

type ModeType = 'solo' | 'trio' | 'tag';

export default function RankingClient() {
  const fetched = useRef(false);

  const getInitialMode = (): ModeType => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedMode');
      if (saved === 'solo' || saved === 'trio' || saved === 'tag') return saved;
    }
    return 'trio';
  };

  const [mode, setMode] = useState<ModeType>(getInitialMode);

  useEffect(() => {
    localStorage.setItem('selectedMode', mode);
  }, [mode]);

  const [data, setData] = useState<RankingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    reloadData();
  }, [reloadData]);

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

  if (error === '429') return <RankingRateLimit />;
  if (error) return <RankingError />;

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

  if (data === null) {
    return <RankingError />;
  }

  const now = data.now_time;
  const last = data.last_backup;

  const getPlayersByMode = () => {
    switch (mode) {
      case 'solo': return data.solo_players;
      case 'trio': return data.trio_players;
      case 'tag':  return data.tagMatch_players;
    }
  };

  const getChartData = () => {
    switch (mode) {
      case 'solo': return data.solo_stats;
      case 'trio': return data.trio_stats;
      case 'tag':  return data.tagMatch_stats;
    }
  };

  const chartData = getChartData();

  const getModeTitle = () => {
    switch (mode) {
      case 'solo': return '솔로를 빛낸 100명의 위인들';
      case 'trio': return 'Top 100 랭커 (트리오)';
      case 'tag': return 'Top 100 랭커 (태그매치)';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 relative min-h-screen">
      {/* ▶ 검색바 */}
      <div className="flex justify-end mb-4">
        <PlayerSearchBar />
      </div>

      {/* ▶ 모드 선택 버튼 */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          className={`px-4 py-2 rounded shadow ${mode === 'tag' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('tag')}
        >
          태그매치
        </button>
        <button
          className={`px-4 py-2 rounded shadow ${mode === 'trio' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('trio')}
        >
          트리오
        </button>
  {/*      <button
          className={`px-4 py-2 rounded shadow ${mode === 'solo' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('solo')}
        >
          솔로
        </button>*/}

      </div>

      {/* ▶ 제목 및 시간 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-left">{getModeTitle()}</h1>
        <div className="text-xs text-gray-400 text-left leading-tight">
          <div>이전 업데이트 시간: {last || '-'}</div>
          <div>최근 업데이트 시간: {now}</div>
        </div>
      </div>

      {/* ▶ 랭킹 테이블 */}
      <RankingTable
        players={getPlayersByMode()}
        mode={mode}
      />

      {/* ▶ 챔피언 차트 (현재는 mode 상관없이 3종류 모두 보여주는 구조를 유지) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {/*mode === 'tag' && (*/
          <ChampionBarChart
            labels={data.tagMatch_stats.labels}
            counts={data.tagMatch_stats.counts}
            title="자주 사용된 주 캐릭터 (태그매치)"
          />
        /*)*/}

        <ChampionBarChart
          labels={data.trio_stats.labels}
          counts={data.trio_stats.counts}
          title="자주 사용된 주 캐릭터 (트리오)"
        />
  {/*      <ChampionBarChart
          labels={data.solo_stats.labels}
          counts={data.solo_stats.counts}
          title="자주 사용된 주 캐릭터 (솔로)"
        />*/}

      </div>

      <hr className="my-10 border-gray-300" />
      <p className="text-center text-xs text-gray-500 mt-8 mb-2">
        이 사이트는 비공식 팬사이트이며, 아수라장 공식 서비스와는 무관합니다.
        <br />
        모든 데이터는 본인 계정 또는 등록된 계정을 통해 수집되며, 단순 열람용으로 제공됩니다.
      </p>

      {/* ▶ 로딩 상태 오버레이 */}
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
