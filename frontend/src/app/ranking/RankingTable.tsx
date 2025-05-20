'use client';
import React from 'react';
import { Player } from './types';

interface Props {
  players: Player[];
  mode: 'solo' | 'trio';
}

export default function RankingTable({ players }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-neutral-100  rounded-lg overflow-hidden border border-gray-300 shadow-sm ">
        {/* 컬럼 너비 고정 */}
        <colgroup>
          <col style={{ width: '7%' }} />
          <col style={{ width: '32%' }} />
          <col style={{ width: '32%' }} />
          <col style={{ width: '28%' }} />
        </colgroup>

        <thead className="bg-neutral-200">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">등수</th>
            <th className="px-4 py-2 text-left font-semibold">아이디</th>
            <th className="px-4 py-2 text-left font-semibold">주 캐릭터</th>
            <th className="px-4 py-2 text-left font-semibold">플레이 포인트</th>
          </tr>
        </thead>

        <tbody>
          {players.map((p) => {
            const isNew = p.rank_change === 'new';
            const up = typeof p.rank_change === 'number' && p.rank_change > 0;
            const down = typeof p.rank_change === 'number' && p.rank_change < 0;
            const scoreChange = p.score_change;

            return (
              <tr
                key={`${p.rank}-${p.nickname}`}
                className="border-t border-gray-300 even:bg-neutral-50 font-geistmono cursor-pointer hover:bg-blue-50"
                title={`${p.nickname_raw}의 매치 상세로 이동`}
                aria-label={`${p.nickname_raw}의 매치 상세로 이동`}
                onClick={() => {
                  window.location.href = `/player-match?viewNickname=${encodeURIComponent(p.nickname_raw ?? '')}`;
                }}
              >
                {/* 등수 */}
                <td className="px-5 py-3 whitespace-nowrap font-medium">
                  {p.rank}
                </td>

                {/* 아이디 + 등수 변동 */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span>{p.nickname}</span>
                  {' '}
                  {isNew ? (
                    <span className=" text-yellow-300 ">(new!)</span>
                  ) : (
                    typeof p.rank_change === 'number' && p.rank_change !== 0 && (
                      <span
                        className={` ${
                          up ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        ({up ? `↑${p.rank_change}` : `↓${Math.abs(p.rank_change)}`})
                      </span>
                    )
                  )}
                </td>

                {/* 주 캐릭터 */}
                <td className="px-4 py-3 whitespace-nowrap">{p.champion}</td>

                {/* 플레이 포인트 + 변화 */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-block min-w-[42px]">{p.score.toLocaleString()}</span>
                  {scoreChange !== null && scoreChange !== undefined && scoreChange !== 0 && (
                    <span
                      className={`${
                        scoreChange > 0 ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      ({scoreChange > 0 ? `+${scoreChange.toLocaleString()}` : `-${Math.abs(scoreChange).toLocaleString()}`})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
