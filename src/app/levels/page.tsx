"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  getProfile,
  createGuestProfile,
  claimLevelReward,
  isLevelRewardClaimed,
} from "@/lib/user/storage";
import { upsertProfile } from "@/lib/supabase/profile";
import { getLevelProgress, LEVEL_REWARDS, LevelReward } from "@/lib/user/levels";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import { DEFAULT_AVATAR_CONFIG, UserProfile } from "@/types";

const BLUE = "#3B82F6";
const MINT = "#34D399";

// ── Icons ─────────────────────────────────────────────────────────────────────

function CrownIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function StarIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ── Reward icon (used in track nodes + detail panel) ──────────────────────────

function RewardIcon({ reward, size = 24 }: { reward: LevelReward; size?: number }) {
  if (reward.type === "ink_drops") {
    return (
      <span style={{ display: "inline-flex", width: size, height: size }}>
        <InkDropIcon className="w-full h-full" color={MINT} />
      </span>
    );
  }
  if (reward.type === "title") return <CrownIcon size={size} color="#D4AF37" />;
  if (reward.type === "badge") return <StarIcon size={size} color="#FBBF24" />;
  if (reward.type === "cosmetic" && reward.itemId) {
    if (reward.itemId.startsWith("color_")) {
      const hex = reward.itemId.replace("color_", "");
      return (
        <div
          className="rounded-full border-2 border-white/20"
          style={{ width: size, height: size, backgroundColor: hex, boxShadow: `0 0 8px ${hex}80` }}
        />
      );
    }
    if (reward.itemId.includes(":")) {
      const [auraId, color] = reward.itemId.split(":");
      return (
        <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, aura: auraId, aura_color: color }} size={size} />
      );
    }
  }
  return null;
}

// ── Reward accent color ───────────────────────────────────────────────────────

function rewardAccent(reward: LevelReward): string {
  if (reward.type === "title") return "#D4AF37";
  if (reward.type === "badge") return "#FBBF24";
  if (reward.type === "cosmetic" && reward.itemId) {
    if (reward.itemId.startsWith("color_")) return reward.itemId.replace("color_", "");
    if (reward.itemId.includes(":")) return reward.itemId.split(":")[1];
  }
  return MINT;
}

// ── Interactive reward track ──────────────────────────────────────────────────

const NODE_STEP = 96;
const TRACK_PAD = 56;
const TRACK_H = 160;
const NODE_CY = 80;
const NODE_R = 20;

function RewardTrack({
  currentLevel,
  profile,
  light,
  selectedLevel,
  onSelect,
}: {
  currentLevel: number;
  profile: UserProfile;
  light: boolean;
  selectedLevel: number | null;
  onSelect: (level: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const leftIdx = LEVEL_REWARDS.reduce((best, r, i) => (r.level <= currentLevel ? i : best), 0);
  const rightIdx = Math.min(leftIdx + 1, LEVEL_REWARDS.length - 1);
  const leftNode = LEVEL_REWARDS[leftIdx];
  const rightNode = LEVEL_REWARDS[rightIdx];
  const t =
    leftNode.level === rightNode.level
      ? 1
      : Math.min(1, (currentLevel - leftNode.level) / (rightNode.level - leftNode.level));
  const playerX = TRACK_PAD + leftIdx * NODE_STEP + t * NODE_STEP;

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // Scroll to selected node, or player position
    const targetIdx = selectedLevel
      ? LEVEL_REWARDS.findIndex((r) => r.level === selectedLevel)
      : -1;
    const targetX = targetIdx >= 0
      ? TRACK_PAD + targetIdx * NODE_STEP
      : playerX;
    container.scrollLeft = Math.max(0, targetX - container.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalWidth = TRACK_PAD * 2 + (LEVEL_REWARDS.length - 1) * NODE_STEP;
  const trackBg = light ? "#E2E8F0" : "rgba(255,255,255,0.08)";

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: light ? "#CBD5E1 transparent" : "rgba(255,255,255,0.15) transparent" }}
    >
      <div style={{ width: totalWidth, height: TRACK_H, position: "relative" }}>

        {/* Base track */}
        <div style={{
          position: "absolute", top: NODE_CY - 2, left: TRACK_PAD,
          right: TRACK_PAD, height: 4, borderRadius: 4, backgroundColor: trackBg,
        }} />

        {/* Filled track */}
        <div style={{
          position: "absolute", top: NODE_CY - 2, left: TRACK_PAD,
          width: Math.max(0, playerX - TRACK_PAD), height: 4, borderRadius: 4,
          background: `linear-gradient(90deg, ${MINT}, ${BLUE})`,
          boxShadow: `0 0 8px ${BLUE}50`,
        }} />

        {/* Player marker */}
        <div style={{
          position: "absolute", left: playerX, top: NODE_CY - NODE_R - 42,
          transform: "translateX(-50%)", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2, zIndex: 20, pointerEvents: "none",
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${BLUE}, ${MINT})`,
            borderRadius: 10, padding: 2,
            boxShadow: `0 0 10px ${BLUE}70`,
          }}>
            <InkAvatar config={profile.avatar_config} size={28} />
          </div>
          <div style={{ width: 2, height: 10, backgroundColor: BLUE, borderRadius: 2, opacity: 0.7 }} />
        </div>

        {/* Nodes */}
        {LEVEL_REWARDS.map((reward, idx) => {
          const cx = TRACK_PAD + idx * NODE_STEP;
          const claimed = isLevelRewardClaimed(reward.level, profile);
          const reachable = currentLevel >= reward.level;
          const claimable = reachable && !claimed;
          const isSelected = selectedLevel === reward.level;
          const accent = rewardAccent(reward);

          let bg = light ? "#E8EDF2" : "rgba(255,255,255,0.07)";
          let border = light ? "#CBD5E1" : "rgba(255,255,255,0.1)";
          let shadow = "none";

          if (claimed) { bg = `${MINT}20`; border = `${MINT}55`; }
          else if (claimable) { bg = `${BLUE}18`; border = BLUE; shadow = `0 0 12px ${BLUE}55`; }

          if (isSelected) {
            border = claimable ? BLUE : claimed ? MINT : accent;
            shadow = `0 0 0 3px ${claimable ? BLUE : claimed ? MINT : accent}35`;
          }

          return (
            <div
              key={reward.level}
              style={{
                position: "absolute", left: cx, top: NODE_CY - NODE_R,
                width: NODE_R * 2, transform: "translateX(-50%)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5, zIndex: 10,
              }}
            >
              <button
                onClick={() => onSelect(reward.level)}
                title={reward.label}
                style={{
                  width: NODE_R * 2, height: NODE_R * 2, borderRadius: "50%",
                  border: `2px solid ${border}`, backgroundColor: bg, boxShadow: shadow,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "transform 0.12s, box-shadow 0.12s",
                  position: "relative",
                }}
                className="hover:scale-110 active:scale-95"
              >
                {claimed ? (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : !reachable ? (
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={light ? "#94A3B8" : "rgba(255,255,255,0.25)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <div style={{ opacity: claimable ? 1 : 0.7 }}>
                    <RewardIcon reward={reward} size={14} />
                  </div>
                )}
                {claimable && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: `${BLUE}25`, border: `1.5px solid ${BLUE}50` }}
                  />
                )}
              </button>

              {/* Level label */}
              <span style={{
                fontSize: 8, fontWeight: 800,
                color: claimed ? MINT : claimable ? BLUE : (light ? "#94A3B8" : "rgba(255,255,255,0.3)"),
                letterSpacing: "0.03em",
              }}>
                {reward.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reward detail panel ───────────────────────────────────────────────────────

function RewardDetailPanel({
  reward,
  currentLevel,
  profile,
  light,
  onClaim,
  claiming,
}: {
  reward: LevelReward;
  currentLevel: number;
  profile: UserProfile;
  light: boolean;
  onClaim: (level: number) => Promise<void>;
  claiming: boolean;
}) {
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const divider = light ? "border-[#E2E8F0]" : "border-white/10";

  const claimed = isLevelRewardClaimed(reward.level, profile);
  const reachable = currentLevel >= reward.level;
  const claimable = reachable && !claimed;
  const accent = rewardAccent(reward);
  const isExclusive = reward.type === "cosmetic";

  return (
    <div className={`border-t ${divider} px-4 py-4 flex items-center gap-4`}>
      {/* Icon */}
      <div
        className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}15`, border: `1.5px solid ${accent}30` }}
      >
        <RewardIcon reward={reward} size={32} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-extrabold text-sm ${text}`}>{reward.label}</p>
          {isExclusive && (
            <span
              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              Exclusive
            </span>
          )}
        </div>
        <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>
          {claimed ? "Already claimed" : reachable ? "Ready to claim" : `Unlocks at level ${reward.level} · ${reward.level - currentLevel} away`}
        </p>
        {reward.type === "ink_drops" && (
          <p className={`text-[10px] font-semibold mt-0.5 ${textFaint}`}>+{reward.amount} ink drops added to your balance</p>
        )}
        {isExclusive && (
          <p className={`text-[10px] font-semibold mt-0.5 ${textFaint}`}>Not available in the shop or from packs</p>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0">
        {claimed ? (
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: `${MINT}15` }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-xs font-bold text-[#22C55E]">Claimed</span>
          </div>
        ) : claimable ? (
          <button
            disabled={claiming}
            onClick={() => onClaim(reward.level)}
            className="px-4 py-2 rounded-xl font-extrabold text-xs text-white transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: BLUE, boxShadow: `0 2px 10px ${BLUE}50` }}
          >
            {claiming ? "…" : "Claim"}
          </button>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: light ? "#F1F5F9" : "rgba(255,255,255,0.05)" }}
          >
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={light ? "#94A3B8" : "rgba(255,255,255,0.25)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className={`text-xs font-bold ${textFaint}`}>Lv.{reward.level}</span>
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

  // Auto-select the first claimable reward, else the one at/just before player level
  const defaultSelected = (() => {
    const firstClaimable = LEVEL_REWARDS.find(
      (r) => currentLevel >= r.level && !isLevelRewardClaimed(r.level, profile)
    );
    if (firstClaimable) return firstClaimable.level;
    const firstUpcoming = LEVEL_REWARDS.find((r) => r.level > currentLevel);
    return firstUpcoming?.level ?? LEVEL_REWARDS[0].level;
  })();

  const [selectedLevel, setSelectedLevel] = useState<number>(defaultSelected);

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
      const result = claimLevelReward(level);
      if (!result.success) return;
      const updated = getProfile();
      if (updated) {
        setProfile(updated);
        // After claiming, auto-advance selection to next claimable
        const next = LEVEL_REWARDS.find(
          (r) => r.level > level && updated && currentLevel >= r.level && !isLevelRewardClaimed(r.level, updated)
        );
        if (next) setSelectedLevel(next.level);
      }
      if (user && updated) {
        await upsertProfile(user.id, {
          ink_drops: updated.ink_drops,
          unlocked_items: updated.unlocked_items,
          claimed_level_rewards: updated.claimed_level_rewards,
        });
      }
    } finally {
      setClaimingLevel(null);
    }
  }

  const claimableCount = LEVEL_REWARDS.filter(
    (r) => currentLevel >= r.level && !isLevelRewardClaimed(r.level, profile)
  ).length;
  const claimedCount = LEVEL_REWARDS.filter((r) => isLevelRewardClaimed(r.level, profile)).length;

  const selectedReward = LEVEL_REWARDS.find((r) => r.level === selectedLevel) ?? LEVEL_REWARDS[0];

  // Next reward the player hasn't reached yet
  const nextReward = LEVEL_REWARDS.find((r) => r.level > currentLevel);
  const xpToNextReward = nextReward
    ? (() => {
        const { getXPForLevel } = require("@/lib/user/levels");
        const xpNeeded = getXPForLevel(nextReward.level) - profile.xp;
        return Math.max(0, xpNeeded);
      })()
    : null;

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70 ${textMuted}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-base font-extrabold ${text}`}>Level &amp; Rewards</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-5 py-4 max-w-2xl mx-auto w-full space-y-4">

        {/* ── Level progress ── */}
        <div className={`rounded-2xl p-4 ${cardBg} border ${cardBorder} relative overflow-hidden`}>
          {/* Decorative inkling */}
          <div className="absolute -right-3 -top-3 opacity-20 pointer-events-none">
            <InkAvatar
              config={{ base: "droplet_03", color: BLUE, eyes: "eyes_05", accessory: "wizard_01", aura: "aura_glow_02", aura_color: BLUE }}
              size={72}
            />
          </div>

          <div className="flex items-center gap-3 mb-3">
            {/* Level badge */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg text-white"
              style={{ backgroundColor: BLUE, boxShadow: `0 3px 12px ${BLUE}50` }}
            >
              {currentLevel}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold ${text}`}>Level {currentLevel}</p>
              <p className={`text-xs font-semibold ${textMuted}`}>
                {levelProgress.xpInLevel} / {levelProgress.xpNeededForLevel} XP
                <span className={`ml-1 ${textFaint}`}>· {Math.round(levelProgress.progressPercent)}%</span>
              </p>
            </div>
            {claimableCount > 0 && (
              <span
                className="shrink-0 text-xs font-extrabold px-2.5 py-1 rounded-full animate-pulse"
                style={{ backgroundColor: `${BLUE}20`, color: BLUE }}
              >
                {claimableCount} ready
              </span>
            )}
          </div>

          {/* XP bar */}
          <div className={`w-full h-2.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${levelProgress.progressPercent}%`,
                background: `linear-gradient(90deg, ${MINT}, ${BLUE})`,
                boxShadow: `0 0 8px ${BLUE}50`,
              }}
            />
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-2.5">
            <p className={`text-[11px] font-semibold ${textFaint}`}>
              {claimedCount} / {LEVEL_REWARDS.length} rewards claimed
            </p>
            {nextReward && xpToNextReward !== null && (
              <p className={`text-[11px] font-semibold ${textFaint}`}>
                {xpToNextReward > 0 ? `${xpToNextReward} XP to Lv.${nextReward.level} reward` : `Lv.${nextReward.level} reward ready`}
              </p>
            )}
          </div>
        </div>

        {/* ── Reward track ── */}
        <div className={`rounded-2xl ${cardBg} border ${cardBorder} overflow-hidden`}>
          {/* Track header */}
          <div className={`px-4 pt-3.5 pb-2.5 flex items-center justify-between`}>
            <p className={`text-sm font-extrabold ${text}`}>Rewards</p>
            <p className={`text-[11px] font-semibold ${textMuted}`}>
              Tap a node · scroll to explore
            </p>
          </div>

          {/* Scrollable track */}
          <RewardTrack
            currentLevel={currentLevel}
            profile={profile}
            light={light}
            selectedLevel={selectedLevel}
            onSelect={setSelectedLevel}
          />

          {/* Detail panel for selected reward */}
          <RewardDetailPanel
            reward={selectedReward}
            currentLevel={currentLevel}
            profile={profile}
            light={light}
            onClaim={handleClaim}
            claiming={claimingLevel === selectedLevel}
          />
        </div>

        <p className={`text-center text-xs font-semibold pb-4 ${textFaint}`}>
          Earn XP by playing ranked and casual matches
        </p>
      </div>

      {/* Claim loading overlay */}
      {claimingLevel !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className={`rounded-2xl px-6 py-4 ${cardBg} shadow-2xl border ${cardBorder}`}>
            <p className={`font-extrabold text-sm ${text}`}>Claiming…</p>
          </div>
        </div>
      )}
    </main>
  );
}
