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
      imageLoadCache[src] = true;  // 성공한 경우에만 true
      if (!cancelled) setCurrentSrc(src);
    };
    
    img.onerror = () => {
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
      onError={() => setCurrentSrc(fallback)}
      loading="lazy"
      {...rest}
      // (fallback 처리용 onError는 JS Image 객체에서 이미 했으므로 여기선 생략)
    />
  );
}


