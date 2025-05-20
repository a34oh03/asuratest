"use client";
import dynamic from "next/dynamic";
const PlayerMatchClient = dynamic(() => import("./PlayerMatchClient"), { ssr: false });

export default function PlayerMatchPage() {
  return <PlayerMatchClient />;
}