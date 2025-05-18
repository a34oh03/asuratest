'use client';

import React, { useState, useEffect } from 'react';
import { RankingSummary } from './types';
import RankingTable from './RankingTable';
import ChampionBarChart from './ChampionBarChart';
import PlayerSearchBar from './PlayerSearchBar';

export default function RankingClient({ data }: { data: RankingSummary }) {
  const [mode, setMode] = useState<'solo' | 'trio'>('solo');

  useEffect(() => {
    const saved = localStorage.getItem('selectedMode');
    if (saved === 'solo' || saved === 'trio') {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedMode', mode);
  }, [mode]);

  const now = data.now_time;
  const last = data.last_backup;

  return (
    <div className="max-w-5xl mx-auto p-4 relative min-h-screen">
      <div className="flex justify-end">
        <PlayerSearchBar />
      </div>

  {/* 🔽 솔로/트리오 버튼 */}
  <div className="flex gap-2 justify-center mb-4">
    <button
      className={`px-4 py-2 rounded shadow ${mode === 'solo' ? 'bg-blue-600 text-white' : 'bg-gray-200 '}`}
      onClick={() => setMode('solo')}
    >
      솔로
    </button>
    <button
      className={`px-4 py-2 rounded shadow ${mode === 'trio' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
      onClick={() => setMode('trio')}
    >
      트리오
    </button>
  </div>
  {/* ✅ 제목 + 업데이트 시간 한 줄 정렬 */}
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-bold text-left">
      Top 100 랭커 ({mode === 'solo' ? '솔로' : '트리오'})
    </h1>
    <div className="text-xs text-gray-400 text-left leading-tight">
      <div>
        이전 업데이트 시간: {last || '-'}
      </div>
      <div>
        최근 업데이트 시간: {now}
      </div>
    </div>
  </div>

      <RankingTable players={mode === 'solo' ? data.solo_players : data.trio_players} mode={mode} />
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
        이 사이트는 비공식 팬사이트이며, 아수라장 공식 서비스와는 무관합니다.<br />
        모든 데이터는 본인 계정 또는 등록된 계정을 통해 수집되며, 단순 열람용으로 제공됩니다.
      </p>
    </div>
  );
}
