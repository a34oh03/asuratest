'use client';
import React from 'react';

export default function RankingRateLimit() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center bg-white">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Too Many Requests</h1>
      <img src="/static/rate_limit.png" alt="제한됨 이미지" width={200} className="mb-6 mx-auto" />
      <div className="main-message text-2xl font-bold text-gray-900 leading-relaxed mb-6">
        무료 서버 터진닷 !!!!<br />
        <br /><br />
        1분 후 이용해주세요
      </div>
      <div className="sub-message text-lg text-gray-500 mt-6">
        ※ 페이지를 고의적으로 새로고침 하지 말아주세요
      </div>
    </div>
  );
}
