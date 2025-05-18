"use client";
import React, { useState } from "react";

export type TabType = "all" | "solo" | "trio";

interface PlayerMatchTabsProps {
  current: TabType;
  onChange: (tab: TabType) => void;
}

const tabLabels = [
  { key: "all", label: "전체" },
  { key: "solo", label: "솔로" },
  { key: "trio", label: "트리오" }
];

export default function PlayerMatchTabs({ current, onChange }: PlayerMatchTabsProps) {
  return (
    <div className="flex gap-2 justify-center my-4">
      {tabLabels.map(tab => (
        <button
          key={tab.key}
          className={`px-4 py-2 rounded font-semibold transition border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400
            ${current === tab.key ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-100"}`}
          onClick={() => onChange(tab.key as TabType)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
