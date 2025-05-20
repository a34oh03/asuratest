'use client';
import React from 'react';

interface Props {
  labels: string[];
  counts: number[];
  title: string;
}

export default function ChampionBarChart({ labels, counts, title }: Props) {
  const max = Math.max(...counts, 1);
  return (
    <div className="w-full mb-6">
      <h3 className="font-semibold mb-2 text-gray-1000">{title}</h3>
      <div className="space-y-1">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center">
            <span className="w-17 text-sm truncate text-gray-500">{label}</span>
            <div className="flex-1 mx-2 bg-gray-100 rounded h-5 relative">
              <div
                className="bg-blue-500 h-5 rounded"
                style={{ width: `${(counts[i] / max) * 100}%` }}
              />
              <span className="absolute right-2 top-0 text-xs text-gray-800">{counts[i]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
