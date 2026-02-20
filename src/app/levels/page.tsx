"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, saveProfile, createGuestProfile, claimLevelReward, isLevelRewardClaimed } from "@/lib/user/storage";
import { fetchProfile, claimLevelRewardRemote } from "@/lib/supabase/profile";
import { getLevelProgress, LEVEL_REWARDS, LevelReward } from "@/lib/user/levels";
import { LEVEL_EXCLUSIVE_AURA_VARIANTS } from "@/lib/cosmetics/catalog";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

const BLUE = "#3B82F6";
const MINT = "#34D399";

// ── Icon helpers ─────────────────────────────────────────────────────────────

function GiftIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 8 12 8" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CrownIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ── Reward preview visual ─────────────────────────────────────────────────────

function RewardPreview({ reward }: { reward: LevelReward }) {
  if (reward.type === "ink_drops") {
    return (
      <div className="flex flex-col items-center gap-1">
        <InkDropIcon className="w-8 h-8" color={MINT} />
        <span className="text-[11px] font-extrabold tabular-nums" style={{ color: MINT }}>
          +{reward.amount}
        </span>
      </div>
    );
  }

  if (reward.type === "title") {
    return (
      <div className="flex flex-col items-center gap-1">
        <CrownIcon className="w-8 h-8" color="#D4AF37" />
        <span className="text-[10px] font-bold text-center leading-tight" style={{ color: "#D4AF37" }}>
          Title
        </span>
      </div>
    );
  }

  if (reward.type === "badge") {
    return (
      <div className="flex flex-col items-center gap-1">
        <StarIcon className="w-8 h-8" color="#FBBF24" />
        <span className="text-[10px] font-bold text-center leading-tight" style={{ color: "#FBBF24" }}>
          Badge
        </span>
      </div>
    );
  }

  // Cosmetic: color or aura variant
  if (reward.type === "cosmetic" && reward.itemId) {
    if (reward.itemId.startsWith("color_")) {
      const hex = reward.itemId.replace("color_", "");
      return (
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg"
            style={{ backgroundColor: hex, boxShadow: `0 0 12px ${hex}60` }}
          />
          <span className="text-[10px] font-bold" style={{ color: hex }}>Color</span>
        </div>
      );
    }

    if (reward.itemId.includes(":")) {
      const [auraId, color] = reward.itemId.split(":");
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10">
            <InkAvatar
              config={{ ...DEFAULT_AVATAR_CONFIG, aura: auraId, aura_color: color }}
              size={40}
            />
          </div>
          <span className="text-[10px] font-bold" style={{ color }}>Aura</span>
        </div>
      );
    }
  }

  return null;
}

// ── Reward card ───────────────────────────────────────────────────────────────

function RewardCard({
  reward,
  currentLevel,
  profile,
  light,
  onClaim,
}: {
  reward: LevelReward;
  currentLevel: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  light: boolean;
  onClaim: (level: number) => Promise<void>;
}) {
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";

  const levelReached = currentLevel >= reward.level;
  const claimed = isLevelRewardClaimed(reward.level, profile);
  const claimable = levelReached && !claimed;

  const isExclusive = reward.type === "cosmetic";
  const isAura = reward.itemId?.includes(":");
  const isColor = reward.itemId?.startsWith("color_");

  let accentColor = MINT;
  if (reward.type === "title") accentColor = "#D4AF37";
  if (reward.type === "badge") accentColor = "#FBBF24";
  if (isColor && reward.itemId) accentColor = reward.itemId.replace("color_", "");
  if (isAura && reward.itemId) accentColor = reward.itemId.split(":")[1];

  return (
    <div
      className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
        claimed
          ? light ? "bg-[#ECFDF5] border-[#34D399]/40" : "bg-[#34D399]/10 border-[#34D399]/30"
          : claimable
          ? light ? "bg-white border-[#3B82F6]/60 shadow-[0_4px_20px_rgba(59,130,246,0.2)]" : "bg-[#1E293B] border-[#3B82F6]/60 shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
          : light ? "bg-white border-[#E2E8F0] opacity-70" : "bg-[#1E293B] border-white/10 opacity-60"
      }`}
    >
      {/* Level pill */}
      <div
        className="absolute top-2 left-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: claimed ? `${MINT}20` : claimable ? `${BLUE}20` : "rgba(148,163,184,0.15)",
          color: claimed ? MINT : claimable ? BLUE : (light ? "#94A3B8" : "#64748B"),
        }}
      >
        Lv.{reward.level}
      </div>

      {/* Exclusive badge */}
      {isExclusive && (
        <div
          className="absolute top-2 right-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          Exclusive
        </div>
      )}

      {/* Preview */}
      <div className="pt-8 pb-2 flex items-center justify-center">
        <RewardPreview reward={reward} />
      </div>

      {/* Label */}
      <div className="px-3 pb-2 text-center">
        <p className={`text-xs font-extrabold leading-tight ${claimed ? "text-[#22C55E]" : claimable ? text : textFaint}`}>
          {reward.label}
        </p>
        {isExclusive && (
          <p className="text-[9px] font-semibold mt-0.5" style={{ color: accentColor }}>
            {isAura ? "Exclusive Aura" : isColor ? "Exclusive Color" : ""}
          </p>
        )}
      </div>

      {/* Action area */}
      <div className="px-3 pb-3">
        {claimed ? (
          <div className="flex items-center justify-center gap-1 py-1.5 rounded-xl" style={{ backgroundColor: `${MINT}20` }}>
            <CheckIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-[#22C55E]">Claimed</span>
          </div>
        ) : claimable ? (
          <button
            onClick={() => onClaim(reward.level)}
            className="w-full py-1.5 rounded-xl font-extrabold text-[11px] text-white transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: BLUE, boxShadow: `0 2px 8px ${BLUE}50` }}
          >
            Claim
          </button>
        ) : (
          <div className={`flex items-center justify-center gap-1 py-1.5 rounded-xl ${light ? "bg-[#F8FAFC]" : "bg-white/5"}`}>
            <LockIcon className="w-3 h-3" color={light ? "#CBD5E1" : "rgba(255,255,255,0.2)"} />
            <span className={`text-[11px] font-bold ${textFaint}`}>{reward.level - currentLevel} levels</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LevelsPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState(() => getProfile() ?? createGuestProfile());
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
  const levelProgress = getLevelProgress(profile.xp);
  const currentLevel = levelProgress.level;

  useEffect(() => {
    setProfile(getProfile() ?? createGuestProfile());
  }, []);

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  async function handleClaim(level: number) {
    if (claimingLevel !== null) return;
    setClaimingLevel(level);
    try {
      if (user) {
        const result = await claimLevelRewardRemote(level);
        if (result.success) {
          const remote = await fetchProfile(user.id);
          if (remote) {
            saveProfile(remote);
            setProfile(remote);
          }
        }
      } else {
        const result = claimLevelReward(level);
        if (result.success) setProfile(getProfile() ?? profile);
      }
    } finally {
      setClaimingLevel(null);
    }
  }

  // Split rewards into sections
  const claimable = LEVEL_REWARDS.filter(r => currentLevel >= r.level && !isLevelRewardClaimed(r.level, profile));
  const upcoming = LEVEL_REWARDS.filter(r => currentLevel < r.level).slice(0, 12);
  const claimed = LEVEL_REWARDS.filter(r => isLevelRewardClaimed(r.level, profile));

  // Number of level-exclusive aura variants to hint about
  const levelExclusiveCount = LEVEL_EXCLUSIVE_AURA_VARIANTS.length;

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-base font-extrabold ${text} flex items-center gap-2`}>
          <GiftIcon className="w-5 h-5" color={BLUE} />
          Level &amp; Rewards
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 py-4 max-w-4xl mx-auto w-full space-y-6">

        {/* Level progress card */}
        <div className={`rounded-2xl p-4 sm:p-5 ${cardBg} border ${cardBorder} relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 opacity-30 pointer-events-none">
            <InkAvatar config={{ base: "droplet_03", color: BLUE, eyes: "eyes_05", accessory: "wizard_01", aura: "aura_glow_02", aura_color: BLUE }} size={80} />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-xl text-white shadow-lg"
              style={{ backgroundColor: BLUE, boxShadow: `0 4px 14px ${BLUE}50` }}
            >
              {currentLevel}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-extrabold ${text}`}>Level {currentLevel}</p>
              <p className={`text-xs font-semibold ${textMuted}`}>
                {levelProgress.xpInLevel} / {levelProgress.xpNeededForLevel} XP to Lv.{currentLevel + 1}
              </p>
            </div>
            <span className={`text-sm font-bold shrink-0 ${textFaint}`}>
              {Math.round(levelProgress.progressPercent)}%
            </span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${levelProgress.progressPercent}%`, backgroundColor: BLUE, boxShadow: `0 0 8px ${BLUE}60` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between mt-3">
            <p className={`text-[11px] font-semibold ${textFaint}`}>
              {claimed.length}/{LEVEL_REWARDS.length} rewards claimed
            </p>
            <p className={`text-[11px] font-semibold ${textFaint}`}>
              {levelExclusiveCount} exclusive auras · 4 exclusive colors
            </p>
          </div>
        </div>

        {/* Exclusive cosmetics callout */}
        <div
          className={`rounded-xl p-3 flex items-center gap-3 border-2`}
          style={{ borderColor: `${BLUE}30`, backgroundColor: `${BLUE}08` }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${BLUE}20` }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={BLUE} strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className={`text-xs font-extrabold ${text}`}>Level-Exclusive Cosmetics</p>
            <p className={`text-[10px] font-semibold ${textMuted}`}>
              Unique ink colors and aura variants only obtainable here — not available in the Shop or from packs.
            </p>
          </div>
        </div>

        {/* Claimable now */}
        {claimable.length > 0 && (
          <div>
            <p className={`text-sm font-extrabold mb-3 flex items-center gap-2 ${text}`}>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
              Ready to Claim ({claimable.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {claimable.map(r => (
                <RewardCard
                  key={r.level}
                  reward={r}
                  currentLevel={currentLevel}
                  profile={profile}
                  light={light}
                  onClaim={handleClaim}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <p className={`text-sm font-extrabold mb-3 ${text}`}>Upcoming Rewards</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {upcoming.map(r => (
                <RewardCard
                  key={r.level}
                  reward={r}
                  currentLevel={currentLevel}
                  profile={profile}
                  light={light}
                  onClaim={handleClaim}
                />
              ))}
            </div>
            {LEVEL_REWARDS.filter(r => currentLevel < r.level).length > 12 && (
              <p className={`text-center text-xs font-semibold mt-3 ${textFaint}`}>
                + {LEVEL_REWARDS.filter(r => currentLevel < r.level).length - 12} more rewards at higher levels
              </p>
            )}
          </div>
        )}

        {/* Claimed */}
        {claimed.length > 0 && (
          <div>
            <p className={`text-sm font-extrabold mb-3 ${text}`}>Claimed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {claimed.map(r => (
                <RewardCard
                  key={r.level}
                  reward={r}
                  currentLevel={currentLevel}
                  profile={profile}
                  light={light}
                  onClaim={handleClaim}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <p className={`text-center text-xs font-semibold pb-4 ${textFaint}`}>
          Earn XP by playing ranked and casual matches
        </p>
      </div>

      {/* Claim loading overlay */}
      {claimingLevel !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 text-center ${cardBg} shadow-2xl`}>
            <p className={`font-extrabold ${text}`}>Claiming reward…</p>
          </div>
        </div>
      )}
    </main>
  );
}
