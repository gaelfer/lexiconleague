"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, createGuestProfile } from "@/lib/storage";
import { UserProfile } from "@/types";
import RankBadge from "@/components/RankBadge";
import ProgressBar from "@/components/ProgressBar";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import BookIcon from "@/components/icons/BookIcon";
import TrophyIcon from "@/components/icons/TrophyIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import { getTierProgress, getTrophiesInTier, getTrophiesNeededForNextTier } from "@/lib/rank";
import { canClaimDailyReward } from "@/lib/daily-rewards";
import { RANK_TIERS, RANK_COLORS } from "@/types";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let p = getProfile();
    if (!p) p = createGuestProfile();
    setProfile(p);
  }, []);

  const tierProgress = profile ? getTierProgress(profile.trophies, profile.rank_tier) : 0;
  const trophiesInTier = profile ? getTrophiesInTier(profile.trophies, profile.rank_tier) : 0;
  const tierIdx = profile ? RANK_TIERS.indexOf(profile.rank_tier) : 0;
  const tierColor = profile ? RANK_COLORS[profile.rank_tier] : "#3B82F6";

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Decorative top pattern */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#3B82F6]/10" />
        <div className="absolute top-8 left-1/4 w-32 h-32 rounded-full bg-[#34D399]/10" />
        <div className="absolute top-20 right-1/3 w-24 h-24 rounded-full bg-[#22C55E]/10" />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-5 py-4 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <SparkIcon className="w-6 h-6" color="#3B82F6" />
          </div>
          <span className="text-xl font-extrabold text-[#0F172A]">
            Lexicon<span className="text-[#3B82F6]">League</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all"
                  >
                    {profile && <InkAvatar config={profile.avatar_config} size="xs" />}
                    {profile && <RankBadge tier={profile.rank_tier} size="sm" />}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#64748B]">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[#E2E8F0]">
                        <p className="text-[#0F172A] text-sm font-semibold truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <InkDropIcon className="w-3.5 h-3.5" color="#3B82F6" />
                          <span className="text-xs font-bold text-[#3B82F6]">{profile?.ink_drops ?? 0} Ink Drops</span>
                        </div>
                      </div>
                      <Link
                        href="/shop"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#F8FAFC] text-sm font-semibold transition-colors"
                      >
                        <InkDropIcon className="w-4 h-4" color="currentColor" />
                        Ink Shop
                        {profile && canClaimDailyReward(profile) && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                        )}
                      </Link>
                      <Link
                        href="/locker"
                        onClick={() => setMenuOpen(false)}
                        className="block w-full text-left px-4 py-3 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#F8FAFC] text-sm font-semibold transition-colors"
                      >
                        Ink Locker
                      </Link>
                      <button
                        onClick={() => { signOut(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 text-sm font-semibold transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2.5 text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] transition-all shadow-md hover:shadow-lg"
                  >
                    Join Free
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 py-12 sm:py-16 gap-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm text-sm font-bold text-[#3B82F6]">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
          Season 1 is live!
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] leading-tight">
          Words are your{" "}
          <span className="text-[#3B82F6]">superpower.</span>
          <br />
          <span className="text-[#34D399]">Master them!</span>
        </h1>

        <p className="text-[#64748B] text-lg max-w-xl font-medium">
          Race through 60-second vocabulary sprints. Climb from Bronze to Diamond. Beat your best and become a word champion!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/play/casual"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-lg text-white rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <SparkIcon className="w-5 h-5" color="white" />
            Play Casual
          </Link>
          <Link
            href={user ? "/play/ranked" : "/auth/signup"}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-lg rounded-2xl bg-white border-2 border-[#34D399] text-[#059669] hover:bg-[#ECFDF5] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <TrophyIcon className="w-5 h-5" color="#34D399" />
            {user ? "Ranked Mode" : "Join to Rank Up"}
          </Link>
        </div>
      </section>

      {/* Rank Progress Card */}
      {profile && (
        <section className="relative px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1.5">
                  {user ? "Your rank" : "Your progress"}
                </p>
                <RankBadge tier={profile.rank_tier} trophies={profile.trophies} showTrophies size="md" />
              </div>
              <div className="text-right">
                <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1.5">XP</p>
                <p className="text-[#0F172A] font-extrabold text-2xl">{profile.xp.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#64748B] font-semibold">
                <span>{profile.rank_tier} · {trophiesInTier} trophies</span>
                {tierIdx < RANK_TIERS.length - 1 && (
                  <span>
                    {(getTrophiesNeededForNextTier(profile.rank_tier) ?? 0) - profile.trophies} to {RANK_TIERS[tierIdx + 1]}
                  </span>
                )}
              </div>
              <ProgressBar value={tierProgress} color={tierColor} height="h-3" />
            </div>

            {!user && (
              <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-2xl bg-[#ECFDF5] border border-[#34D399]/50">
                <span className="text-[#059669] font-bold text-sm">Save your progress forever</span>
                <Link
                  href="/auth/signup"
                  className="text-xs font-extrabold px-4 py-2 rounded-xl bg-[#34D399] text-white hover:bg-[#10B981] transition-colors"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Daily Reward Banner */}
      {profile && canClaimDailyReward(profile) && (
        <section className="relative px-6 pb-4 max-w-lg mx-auto w-full">
          <Link href="/shop" className="block group">
            <div className="rounded-2xl p-4 bg-[#DBEAFE] border border-[#3B82F6]/30 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#3B82F6] flex items-center justify-center shrink-0 shadow-lg">
                <InkDropIcon className="w-6 h-6" color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#0F172A]">Daily Ink Drops ready!</p>
                <p className="text-xs text-[#3B82F6] font-medium">Claim your reward in the Ink Shop</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse shrink-0" />
            </div>
          </Link>
        </section>
      )}

      {/* Mode Cards */}
      <section className="relative px-6 pb-16 grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto w-full">
        <Link href="/play/casual" className="group block">
          <div className="rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#3B82F6]/50 transition-all duration-200 h-full">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#DBEAFE] group-hover:bg-[#BFDBFE] transition-colors">
              <BookIcon className="w-7 h-7" color="#3B82F6" />
            </div>
            <h3 className="text-[#0F172A] font-extrabold text-xl mb-2">Casual Mode</h3>
            <p className="text-[#64748B] text-sm font-medium mb-4">
              Pick vocabulary or punctuation. 60-second sprint. No rank impact—just fun practice!
            </p>
            <span className="inline-flex items-center gap-1.5 text-[#3B82F6] font-bold text-sm group-hover:gap-2 transition-all">
              Play now
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </Link>

        <Link href={user ? "/play/ranked" : "/auth/signup"} className="group block">
          <div className="rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#34D399]/50 transition-all duration-200 h-full">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#D1FAE5] group-hover:bg-[#A7F3D0] transition-colors">
              <TrophyIcon className="w-7 h-7" color="#34D399" />
            </div>
            <h3 className="text-[#0F172A] font-extrabold text-xl mb-2">Ranked Mode</h3>
            <p className="text-[#64748B] text-sm font-medium mb-4">
              Compete for trophies! Climb from Bronze to Diamond. Every answer counts.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[#34D399] font-bold text-sm group-hover:gap-2 transition-all">
              {user ? "Enter the ladder" : "Create account to play"}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-[#64748B] font-medium border-t border-[#E2E8F0]">
        Lexicon League · Season 1 · Made for word champions
      </footer>
    </main>
  );
}
