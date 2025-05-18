"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerSearchBar() {
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    router.push(`/player-match?viewNickname=${encodeURIComponent(nickname.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center justify-end mb-4">
      <input
        type="text"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="닉네임 검색..."
        className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700 transition"
      >
        검색
      </button>
    </form>
  );
}
