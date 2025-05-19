// components/CachedImageWithFallback.tsx
"use client";

import React, { useState, useEffect } from "react";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback: string;
}

// 모듈 스코프(전역) 캐시 맵
const imageLoadCache: Record<string, boolean> = {};

export default function CachedImageWithFallback({
  src,
  fallback,
  alt,
  className,
  ...rest
}: Props) {
  // 렌더링할 실제 src
  const [currentSrc, setCurrentSrc] = useState<string>(
    imageLoadCache[src] ? src : fallback
  );

  useEffect(() => {
    let cancelled = false;

    // 1) 이미 성공적으로 로드된 src라면 즉시 세팅
    if (imageLoadCache[src]) {
      setCurrentSrc(src);
      return;
    }

    // 2) img 요소 대신 JS Image 객체로 프리로드 시도
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageLoadCache[src] = true;           // 캐시에 성공 표시
      if (!cancelled) setCurrentSrc(src);   // 뷰 업데이트
    };
    img.onerror = () => {
      // 실패도 캐시해 두면 무의미한 재시도 방지
      imageLoadCache[src] = true;
      if (!cancelled) setCurrentSrc(fallback);
    };

    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      {...rest}
      // (fallback 처리용 onError는 JS Image 객체에서 이미 했으므로 여기선 생략)
    />
  );
}
