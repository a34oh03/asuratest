// utils/NoTranslate.tsx
'use client';

import React, { ReactNode } from 'react';

interface NoTranslateProps {
  children: ReactNode;
}

/**
 * NoTranslate 컴포넌트
 * 크롬 번역기(및 HTML5 표준 번역 기능)에서 번역 제외를 보장합니다.
 */
export function NoTranslate({ children }: NoTranslateProps) {
  return (
    <span translate="no" className="notranslate">
      {children}
    </span>
  );
}
