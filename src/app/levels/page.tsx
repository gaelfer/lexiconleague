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
import { LEVEL_EXCLUSIVE_AURA_VARIANTS } from "@/lib/cosmetics/catalog";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import { DEFAULT_AVATAR_CONFIG, UserProfile } from "@/types";

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

// ── Reward mini icon ──────────────────────────────────────────────────────────

function RewardMiniIcon({ reward, size = 20 }: { reward: LevelReward; size?: number }) {
  const cls = `shrink-0`;
  const sz = `${size}px`;
  if (reward.type === "ink_drops") {
    return (
      <span style={{ display: "inline-flex", width: sz, height: sz }}>
        <InkDropIcon className={cls} color={MINT} />
      </span>
    );
  }
  if (reward.type === "title") {
    return (
      <span style={{ display: "inline-flex", width: sz, height: sz }}>
        <CrownIcon className={cls} color="#D4AF37" />
      </span>
    );
  }
  if (reward.type === "badge") {
    return (
      <span style={{ display: "inline-flex", width: sz, height: sz }}>
        <StarIcon className={cls} color="#FBBF24" />
      </span>
    );
  }
  if (reward.type === "cosmetic" && reward.itemId) {
    if (reward.itemId.startsWith("color_")) {
      const hex = reward.itemId.replace("color_", "");
      return (
        <div
          className="rounded-full border border-white/30"
          style={{ width: size, height: size, backgroundColor: hex, boxShadow: `0 0 6px ${hex}80` }}
        />
      );
    }
    if (reward.itemId.includes(":")) {
      const [auraId, color] = reward.itemId.split(":");
      return (
        <InkAvatar
          config={{ ...DEFAULT_AVATAR_CONFIG, aura: auraId, aura_color: color }}
          size={size}
        />
      );
    }
  }
  return null;
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

// ── Reward grid card ──────────────────────────────────────────────────────────

function RewardCard({
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
      <div
        className="absolute top-2 left-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: claimed ? `${MINT}20` : claimable ? `${BLUE}20` : "rgba(148,163,184,0.15)",
          color: claimed ? MINT : claimable ? BLUE : (light ? "#94A3B8" : "#64748B"),
        }}
      >
        Lv.{reward.level}
      </div>
      {isExclusive && (
        <div
          className="absolute top-2 right-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          Exclusive
        </div>
      )}
      <div className="pt-8 pb-2 flex items-center justify-center">
        <RewardPreview reward={reward} />
      </div>
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
      <div className="px-3 pb-3">
        {claimed ? (
          <div className="flex items-center justify-center gap-1 py-1.5 rounded-xl" style={{ backgroundColor: `${MINT}20` }}>
            <CheckIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-[#22C55E]">Claimed</span>
          </div>
        ) : claimable ? (
          <button
            disabled={claiming}
            onClick={() => onClaim(reward.level)}
            className="w-full py-1.5 rounded-xl font-extrabold text-[11px] text-white transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: BLUE, boxShadow: `0 2px 8px ${BLUE}50` }}
          >
            {claiming ? "…" : "Claim"}
          </button>
        ) : (
          <div className={`flex items-center justify-center gap-1 py-1.5 rounded-xl ${light ? "bg-[#F8FAFC]" : "bg-white/5"}`}>
            <LockIcon className="w-3 h-3" color={light ? "#CBD5E1" : "rgba(255,255,255,0.2)"} />
            <span className={`text-[11px] font-bold ${textFaint}`}>{reward.level - currentLevel} lvls</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Horizontal reward track ───────────────────────────────────────────────────

const NODE_STEP = 104;     // px between consecutive reward nodes
const TRACK_PAD = 60;      // px padding left/right of first/last node
const TRACK_H = 196;       // total height of the scroll container
const NODE_CY = 108;       // y-center of the node circle (from top)
const NODE_R = 22;         // radius of node circle

function RewardTrack({
  currentLevel,
  profile,
  light,
  onClaim,
  claimingLevel,
}: {
  currentLevel: number;
  profile: UserProfile;
  light: boolean;
  onClaim: (level: number) => Promise<void>;
  claimingLevel: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute player position on the track
  const leftIdx = LEVEL_REWARDS.reduce((best, r, i) => r.level <= currentLevel ? i : best, 0);
  const rightIdx = Math.min(leftIdx + 1, LEVEL_REWARDS.length - 1);
  const leftNode = LEVEL_REWARDS[leftIdx];
  const rightNode = LEVEL_REWARDS[rightIdx];
  const t =
    leftNode.level === rightNode.level
      ? 1
      : Math.min(1, (currentLevel - leftNode.level) / (rightNode.level - leftNode.level));
  const playerX = TRACK_PAD + leftIdx * NODE_STEP + t * NODE_STEP;

  // Filled track goes up to the player's position
  const fillWidth = playerX;

  // Auto-scroll to put the player in view
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const targetScroll = playerX - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, targetScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalWidth = TRACK_PAD * 2 + (LEVEL_REWARDS.length - 1) * NODE_STEP;

  const trackBg = light ? "#E2E8F0" : "rgba(255,255,255,0.08)";
  const scrollbarBg = light ? "#F1F5F9" : "#1E293B";

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: light ? "#CBD5E1 #F1F5F9" : "rgba(255,255,255,0.15) #1E293B",
      }}
    >
      <div style={{ width: totalWidth, height: TRACK_H, position: "relative" }}>

        {/* Base track line */}
        <div
          style={{
            position: "absolute",
            top: NODE_CY - 2,
            left: TRACK_PAD,
            right: TRACK_PAD,
            height: 4,
            borderRadius: 4,
            backgroundColor: trackBg,
          }}
        />

        {/* Filled progress line */}
        <div
          style={{
            position: "absolute",
            top: NODE_CY - 2,
            left: TRACK_PAD,
            width: Math.max(0, fillWidth - TRACK_PAD),
            height: 4,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${MINT}, ${BLUE})`,
            boxShadow: `0 0 8px ${BLUE}60`,
          }}
        />

        {/* Player avatar marker */}
        <div
          style={{
            position: "absolute",
            left: playerX,
            top: NODE_CY - NODE_R - 52,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            zIndex: 20,
          }}
        >
          <div
            className="rounded-xl p-0.5"
            style={{
              background: `linear-gradient(135deg, ${BLUE}, ${MINT})`,
              boxShadow: `0 0 12px ${BLUE}70`,
            }}
          >
            <InkAvatar config={profile.avatar_config} size={32} />
          </div>
          <div
            className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: BLUE, boxShadow: `0 2px 6px ${BLUE}60` }}
          >
            Lv.{currentLevel}
          </div>
          {/* Connector line from avatar to track */}
          <div style={{ width: 2, height: 8, backgroundColor: BLUE, borderRadius: 2, opacity: 0.6 }} />
        </div>

        {/* Reward nodes */}
        {LEVEL_REWARDS.map((reward, idx) => {
          const cx = TRACK_PAD + idx * NODE_STEP;
          const claimed = isLevelRewardClaimed(reward.level, profile);
          const reachable = currentLevel >= reward.level;
          const claimable = reachable && !claimed;

          let nodeBg = light ? "#E2E8F0" : "rgba(255,255,255,0.08)";
          let nodeBorder = light ? "#CBD5E1" : "rgba(255,255,255,0.12)";
          let nodeShadow = "none";
          let iconOpacity = 0.4;

          if (claimed) {
            nodeBg = `${MINT}25`;
            nodeBorder = `${MINT}60`;
            iconOpacity = 1;
          } else if (claimable) {
            nodeBg = `${BLUE}20`;
            nodeBorder = BLUE;
            nodeShadow = `0 0 14px ${BLUE}60`;
            iconOpacity = 1;
          } else if (reachable) {
            nodeBg = light ? "#F1F5F9" : "rgba(255,255,255,0.06)";
            iconOpacity = 0.7;
          }

          return (
            <div
              key={reward.level}
              style={{
                position: "absolute",
                left: cx,
                top: NODE_CY - NODE_R,
                width: NODE_R * 2,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                zIndex: 10,
              }}
            >
              {/* Node circle */}
              <button
                disabled={!claimable || claimingLevel !== null}
                onClick={claimable ? () => onClaim(reward.level) : undefined}
                style={{
                  width: NODE_R * 2,
                  height: NODE_R * 2,
                  borderRadius: "50%",
                  border: `2px solid ${nodeBorder}`,
                  backgroundColor: nodeBg,
                  boxShadow: nodeShadow,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: claimable ? "pointer" : "default",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  opacity: iconOpacity,
                  position: "relative",
                }}
                className={claimable ? "hover:scale-110 active:scale-95" : ""}
                title={claimable ? `Claim: ${reward.label}` : reward.label}
              >
                {claimed ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : !reachable ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke={light ? "#CBD5E1" : "rgba(255,255,255,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <div style={{ opacity: 1 }}>
                    <RewardMiniIcon reward={reward} size={16} />
                  </div>
                )}
                {/* Pulsing ring for claimable */}
                {claimable && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: `${BLUE}30`, border: `1.5px solid ${BLUE}60` }}
                  />
                )}
              </button>

              {/* Level label below */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: claimed ? MINT : claimable ? BLUE : (light ? "#94A3B8" : "rgba(255,255,255,0.35)"),
                  letterSpacing: "0.02em",
                  marginTop: 2,
                }}
              >
                Lv.{reward.level}
              </span>

              {/* Reward label (for claimable/claimed only) */}
              {(claimable || claimed) && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: claimed ? `${MINT}cc` : `${BLUE}cc`,
                    maxWidth: 72,
                    textAlign: "center",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {reward.label}
                </span>
              )}
            </div>
          );
        })}
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
      // Always claim locally first — this is the reliable source of truth
      const result = claimLevelReward(level);
      if (!result.success) return;

      const updated = getProfile();
      if (updated) setProfile(updated);

      // Sync changed fields to Supabase for authenticated users
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

  const claimable = LEVEL_REWARDS.filter(
    (r) => currentLevel >= r.level && !isLevelRewardClaimed(r.level, profile)
  );
  const upcoming = LEVEL_REWARDS.filter((r) => currentLevel < r.level).slice(0, 8);
  const claimed = LEVEL_REWARDS.filter((r) => isLevelRewardClaimed(r.level, profile));
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

      <div className="flex-1 px-4 sm:px-6 py-4 max-w-4xl mx-auto w-full space-y-5">

        {/* Level progress card */}
        <div className={`rounded-2xl p-4 sm:p-5 ${cardBg} border ${cardBorder} relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-25 pointer-events-none">
            <InkAvatar
              config={{ base: "droplet_03", color: BLUE, eyes: "eyes_05", accessory: "wizard_01", aura: "aura_glow_02", aura_color: BLUE }}
              size={80}
            />
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
          <div className="flex items-center justify-between mt-3">
            <p className={`text-[11px] font-semibold ${textFaint}`}>
              {claimed.length}/{LEVEL_REWARDS.length} rewards claimed
            </p>
            <p className={`text-[11px] font-semibold ${textFaint}`}>
              {levelExclusiveCount} exclusive auras · 4 exclusive colors
            </p>
          </div>
        </div>

        {/* Reward track */}
        <div className={`rounded-2xl ${cardBg} border ${cardBorder} overflow-hidden`}>
          <div className={`px-4 pt-4 pb-2 flex items-center justify-between border-b ${cardBorder}`}>
            <div>
              <p className={`text-sm font-extrabold ${text}`}>Reward Track</p>
              <p className={`text-[11px] font-semibold ${textMuted}`}>
                Scroll to explore · Click glowing nodes to claim
              </p>
            </div>
            {claimable.length > 0 && (
              <span
                className="text-[10px] font-extrabold px-2 py-1 rounded-full animate-pulse"
                style={{ backgroundColor: `${BLUE}20`, color: BLUE }}
              >
                {claimable.length} ready
              </span>
            )}
          </div>
          <div className="px-0 py-3">
            <RewardTrack
              currentLevel={currentLevel}
              profile={profile}
              light={light}
              onClaim={handleClaim}
              claimingLevel={claimingLevel}
            />
          </div>
        </div>

        {/* Exclusive cosmetics callout */}
        <div
          className="rounded-xl p-3 flex items-center gap-3 border-2"
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

        {/* Ready to claim */}
        {claimable.length > 0 && (
          <div>
            <p className={`text-sm font-extrabold mb-3 flex items-center gap-2 ${text}`}>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
              Ready to Claim ({claimable.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {claimable.map((r) => (
                <RewardCard
                  key={r.level}
                  reward={r}
                  currentLevel={currentLevel}
                  profile={profile}
                  light={light}
                  onClaim={handleClaim}
                  claiming={claimingLevel === r.level}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <p className={`text-sm font-extrabold mb-3 ${text}`}>Upcoming</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {upcoming.map((r) => (
                <RewardCard
                  key={r.level}
                  reward={r}
                  currentLevel={currentLevel}
                  profile={profile}
                  light={light}
                  onClaim={handleClaim}
                  claiming={claimingLevel === r.level}
                />
              ))}
            </div>
            {LEVEL_REWARDS.filter((r) => currentLevel < r.level).length > 8 && (
              <p className={`text-center text-xs font-semibold mt-3 ${textFaint}`}>
                + {LEVEL_REWARDS.filter((r) => currentLevel < r.level).length - 8} more rewards at higher levels
              </p>
            )}
          </div>
        )}

        {/* Claimed */}
        {claimed.length > 0 && (
          <div>
            <p className={`text-sm font-extrabold mb-3 ${text}`}>Claimed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {claimed.map((r) => (
                <RewardCard
                  key={r.level}
                  reward={r}
                  currentLevel={currentLevel}
                  profile={profile}
                  light={light}
                  onClaim={handleClaim}
                  claiming={claimingLevel === r.level}
                />
              ))}
            </div>
          </div>
        )}

        <p className={`text-center text-xs font-semibold pb-4 ${textFaint}`}>
          Earn XP by playing ranked and casual matches
        </p>
      </div>

      {/* Claim loading overlay */}
      {claimingLevel !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className={`rounded-2xl px-6 py-4 text-center ${cardBg} shadow-2xl border ${cardBorder}`}>
            <p className={`font-extrabold text-sm ${text}`}>Claiming reward…</p>
          </div>
        </div>
      )}
    </main>
  );
}
