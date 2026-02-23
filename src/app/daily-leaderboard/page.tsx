"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, createGuestProfile, INITIAL_PROFILE } from "@/lib/user/storage";
import { fetchDailyLeaderboard, DailyLeaderboardEntry } from "@/lib/supabase/daily-challenge";
import { getDailySeed, getDailyChallengeTopicAndGrade } from "@/lib/game/daily-challenge";
import { getDailyChallengeState } from "@/lib/user/daily-challenge-storage";
import InkAvatar from "@/components/InkAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import LogoIcon from "@/components/icons/LogoIcon";
import { BLUE, SURFACE } from "@/lib/design-tokens";

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BackIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function RefreshIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#CD7F32"];

export default function DailyLeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { light } = useTheme();
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);

  const seed = getDailySeed();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const { topic, grade } = getDailyChallengeTopicAndGrade();

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const headerBtn = light ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-white/5 border-white/10";
  const rowHover = light ? "hover:bg-[#F8FAFC]" : "hover:bg-white/5";

  useEffect(() => {
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);

    const state = getDailyChallengeState();
    setMyScore(state.bestScore);

    async function load() {
      setLoading(true);
      const data = await fetchDailyLeaderboard(seed);
      setEntries(data);

      if (user) {
        const idx = data.findIndex((e) => e.userId === user.id);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
      setLoading(false);
    }
    load();
  }, [seed, user]);

  async function handleRefresh() {
    setLoading(true);
    const data = await fetchDailyLeaderboard(seed);
    setEntries(data);
    if (user) {
      const idx = data.findIndex((e) => e.userId === user.id);
      setMyRank(idx >= 0 ? idx + 1 : null);
    }
    setLoading(false);
  }

  return (
    <main
      className={`relative min-h-[100dvh] flex flex-col overflow-x-hidden ${bg}`}
      style={!light ? { background: SURFACE } : undefined}
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {!light && (
          <>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 65%)`, transform: "translate(30%, -30%)" }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${SURFACE} 0%, #0c1524 50%, #0a0f1a 100%)` }} />
          </>
        )}
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.back()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${headerBtn} border transition-colors hover:opacity-80`}
            aria-label="Go back"
          >
            <BackIcon className={`w-5 h-5 ${text}`} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${headerBtn} border overflow-hidden p-0.5`}>
            <LogoIcon className="w-full h-full" />
          </div>
          <span className={`text-base font-bold ${text}`}>
            Lexicon<span style={{ color: BLUE }}>League</span>
          </span>
        </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="relative z-10 flex flex-col px-4 pb-12 pt-2 max-w-lg mx-auto w-full gap-6">

        {/* Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className={`w-4 h-4 ${light ? "text-[#3B82F6]" : "text-[#60A5FA]"}`} />
              <span className={`text-xs font-semibold uppercase tracking-widest ${textMuted}`}>Daily Challenge</span>
            </div>
            <h1 className={`text-2xl font-bold ${text}`}>Leaderboard</h1>
            <p className={`text-sm ${textMuted} mt-0.5`}>{dateLabel}</p>
            <p className={`text-xs ${textMuted} mt-0.5`}>{topic} · {grade}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2 rounded-xl border transition-colors ${headerBtn} ${loading ? "opacity-50" : ""}`}
            >
              <RefreshIcon className={`w-4 h-4 ${textMuted} ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/play/daily"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              Play
            </Link>
          </div>
        </div>

        {/* Your rank card — shown if authenticated and has played */}
        {user && myScore > 0 && (
          <div
            className={`rounded-2xl border px-5 py-4 flex items-center justify-between ${cardBg} ${cardBorder}`}
            style={myRank && myRank <= 3 ? { borderColor: MEDAL_COLORS[myRank - 1] } : undefined}
          >
            <div className="flex items-center gap-3">
              <InkAvatar config={profile.avatar_config} size="sm" />
              <div>
                <p className={`font-bold text-sm ${text}`}>{profile.username}</p>
                <p className={`text-xs ${textMuted}`}>Your best today</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black" style={{ color: BLUE }}>{myScore}</p>
              {myRank ? (
                <p className="text-xs font-semibold" style={{ color: myRank <= 3 ? MEDAL_COLORS[myRank - 1] : undefined }}>
                  {myRank <= 3 ? `#${myRank}` : `Rank #${myRank}`}
                </p>
              ) : (
                <p className={`text-xs ${textMuted}`}>Unranked</p>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className={`rounded-2xl border ${cardBg} ${cardBorder} overflow-hidden`}>
          <div className={`px-5 py-4 border-b ${cardBorder} flex items-center justify-between`}>
            <p className={`font-bold text-sm ${text}`}>Top Players</p>
            <p className={`text-xs ${textMuted}`}>{entries.length} players today</p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 px-5 py-3.5 border-b ${cardBorder} last:border-0`}>
                  <div className={`w-6 h-4 rounded ${light ? "bg-[#E2E8F0]" : "bg-white/10"} animate-pulse`} />
                  <div className={`w-8 h-8 rounded-full ${light ? "bg-[#E2E8F0]" : "bg-white/10"} animate-pulse shrink-0`} />
                  <div className={`flex-1 h-4 rounded ${light ? "bg-[#E2E8F0]" : "bg-white/10"} animate-pulse`} />
                  <div className={`w-12 h-4 rounded ${light ? "bg-[#E2E8F0]" : "bg-white/10"} animate-pulse`} />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-6 text-center">
              <p className={`text-sm font-semibold ${textMuted}`}>No scores yet today</p>
              <p className={`text-xs ${textMuted}`}>Be the first to complete today&apos;s challenge!</p>
              <Link
                href="/play/daily"
                className="mt-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                Play Now
              </Link>
            </div>
          ) : (
            <div className="flex flex-col">
              {entries.map((entry, i) => {
                const isMe = user && entry.userId === user.id;
                const medal = i < 3 ? MEDAL_COLORS[i] : null;

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-5 py-3.5 border-b ${cardBorder} last:border-0 transition-colors ${rowHover} ${isMe ? (light ? "bg-blue-50" : "bg-blue-950/30") : ""}`}
                  >
                    {/* Rank */}
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {medal ? (
                        <span className="text-base font-black" style={{ color: medal }}>{i + 1}</span>
                      ) : (
                        <span className={`text-sm font-semibold ${textMuted}`}>{i + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="shrink-0">
                      <InkAvatar config={entry.avatarConfig} size="sm" />
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isMe ? "" : text}`} style={isMe ? { color: BLUE } : undefined}>
                        {entry.username}{isMe && " (you)"}
                      </p>
                      <p className={`text-xs ${textMuted}`}>{entry.correct} correct · {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}</p>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-right">
                      <p className="text-base font-black" style={{ color: medal ?? (isMe ? BLUE : undefined) }}>
                        <span className={medal || isMe ? "" : text}>{entry.bestScore}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA if not played */}
        {!loading && entries.length > 0 && myScore === 0 && (
          <div className={`rounded-2xl border ${cardBg} ${cardBorder} px-6 py-5 text-center`}>
            <p className={`text-sm font-semibold ${textMuted} mb-3`}>You haven&apos;t played today yet!</p>
            <Link
              href="/play/daily"
              className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              Take the Challenge
            </Link>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <Link href="/play/daily" className={`text-sm font-semibold ${textMuted} hover:underline`}>
            Play Today&apos;s Challenge
          </Link>
          <span className={textMuted}>·</span>
          <Link href="/dashboard" className={`text-sm font-semibold ${textMuted} hover:underline`}>
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
