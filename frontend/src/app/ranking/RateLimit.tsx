'use client';
import React from 'react';

export default function RankingRateLimit() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center bg-white">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Too Many Requests</h1>
      <img src="/static/rate_limit.png" alt="제한됨 이미지" width={200} className="mb-6 mx-auto" />
      <div className="main-message text-2xl font-bold text-gray-900 leading-relaxed mb-6">
        누군가가 너무 많은<br />
        조회를 하고 있어요<br /><br />
        1분 후 이용해 주세요...
      </div>
      <div className="sub-message text-lg text-gray-500 mt-6">
        ※ 페이지를 자주 새로고침하면 제한될 수 있어요.
      </div>
    </div>
  );
}
