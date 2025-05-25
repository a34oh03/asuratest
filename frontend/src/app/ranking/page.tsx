// 🔁 서버 컴포넌트
"use client";
import dynamic from "next/dynamic";
const RankingClient = dynamic(() => import("./RankingClient"), { ssr: false });

export default function RankingPage() {
  return <RankingClient />;
}

export const metadata = {
  title: "아수라장 전적 검색",
  description: "아수라장 전적 검색",
};