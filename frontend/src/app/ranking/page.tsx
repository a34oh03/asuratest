// 🔁 서버 컴포넌트
"use client";
import dynamic from "next/dynamic";
const RankingClient = dynamic(() => import("./RankingClient"), { ssr: false });

export default function RankingPage() {
  return <RankingClient />;
}