"use client";
import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChampPieProps {
  playedChamps: { champName: string; matches: number }[];
}

export default function ChampionPieChart({ playedChamps }: ChampPieProps) {
  if (!playedChamps || playedChamps.length === 0) return null;
  const data = {
    labels: playedChamps.map(ch => ch.champName),
    datasets: [
      {
        label: "경기수",
        data: playedChamps.map(ch => ch.matches),
        backgroundColor: [
          '#60a5fa','#fbbf24','#f87171','#34d399','#a78bfa','#f472b6','#facc15','#38bdf8','#fb7185','#4ade80'
        ],
        borderWidth: 1
      }
    ]
  };
  return (
    <div className="w-full max-w-xs mx-auto">
      <Pie data={data} />
    </div>
  );
}
