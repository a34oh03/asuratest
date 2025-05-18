"use client";
import React from "react";

interface PlayerProfileProps {
  nickname: string;
  passLevel?: number;
  mostPlayedChampType?: string;
  mostPlayedChampName?: string;
}

export default function PlayerProfile({ nickname, passLevel, mostPlayedChampType, mostPlayedChampName }: PlayerProfileProps) {
  // 프로필 이미지는 mostPlayedChampType 기준으로 /champion/{mostPlayedChampType}.png 사용
  // mostPlayedChampType이 없으면 default
  const champImg = mostPlayedChampType ? `/champion/${mostPlayedChampType}.png` : '/champion/default.png';
  const champAlt = mostPlayedChampName || mostPlayedChampType || '대표 캐릭터';
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded shadow mb-4 border">
      <img
        src={champImg}
        alt={champAlt}
        className="w-20 h-20 rounded-full border object-cover bg-gray-100"
        onError={e => (e.currentTarget.src = "/champion/default.png")}
      />
      <div>
        <div className="font-bold text-lg">{nickname}</div>
        {mostPlayedChampName && (
          <div className="text-sm text-blue-500">대표 캐릭터: {mostPlayedChampName}</div>
        )}
        {passLevel !== undefined && (
          <div className="text-sm text-gray-500">패스 레벨: {passLevel}</div>
        )}
      </div>
    </div>
  );
}
