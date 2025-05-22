"use client";
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/player-match');
  return null;
}
