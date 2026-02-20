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
  INITIAL_PROFILE,
} from "@/lib/user/storage";
import { syncCurrentProfile } from "@/lib/user/profile-sync";
import { getLevelProgress, getXPForLevel, LEVEL_REWARDS, LevelReward } from "@/lib/user/levels";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import { DEFAULT_AVATAR_CONFIG, UserProfile } from "@/types";

const BLUE = "#3B82F6";
const MINT = "#34D399";

// ── Icons ─────────────────────────────────────────────────────────────────────

function CrownIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function StarIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ── Reward icon ───────────────────────────────────────────────────────────────

function RewardIcon({ reward, size = 40 }: { reward: LevelReward; size?: number }) {
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
          className="rounded-full border-2 border-white/30"
          style={{ width: size, height: size, backgroundColor: hex, boxShadow: `0 0 12px ${hex}90, 0 0 24px ${hex}40` }}
        />
      );
    }
    if (reward.itemId.includes(":")) {
      const [auraId, color] = reward.itemId.split(":");
      return <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, aura: auraId, aura_color: color }} size={size} />;
    }
  }
  return null;
}

function rewardAccent(reward: LevelReward): string {
  if (reward.type === "title") return "#D4AF37";
  if (reward.type === "badge") return "#FBBF24";
  if (reward.type === "cosmetic" && reward.itemId) {
    if (reward.itemId.startsWith("color_")) return reward.itemId.replace("color_", "");
    if (reward.itemId.includes(":")) return reward.itemId.split(":")[1];
  }
  return MINT;
}

// ── Battle-pass track layout constants ───────────────────────────────────────
// Rewards alternate above (even index) and below (odd index) the track bar.

const STEP = 108;      // px between reward centers
const PAD = 64;        // left/right padding
const CARD_W = 84;     // reward card width
const CARD_H = 136;    // reward card height
const NODE_R = 13;     // small node dot on the track bar
const TRACK_BAR_H = 6; // height of the progress bar line
const STEM_H = 12;     // gap between track bar edge and card
// vertical layout (from top of absolute container)
const ABOVE_TOP = 0;
const ABOVE_H = CARD_H + STEM_H;          // 148
const TRACK_CY = ABOVE_H + NODE_R;        // 161  ← center of track bar
const BELOW_TOP = TRACK_CY + NODE_R + STEM_H; // 186
const TOTAL_H = BELOW_TOP + CARD_H + 4;  // 326

// ── Reward card component (positioned inside the absolute track) ──────────────

function TrackCard({
  reward,
  cx,
  above,
  claimed,
  claimable,
  locked,
  claimingLevel,
  light,
  onClaim,
}: {
  reward: LevelReward;
  cx: number;         // center x
  above: boolean;     // above vs below track
  claimed: boolean;
  claimable: boolean;
  locked: boolean;
  claimingLevel: number | null;
  light: boolean;
  onClaim: (level: number) => Promise<void>;
}) {
  const accent = rewardAccent(reward);
  const isExclusive = reward.type === "cosmetic";
  const top = above ? ABOVE_TOP : BELOW_TOP;

  let cardBg = light ? "#ffffff" : "#1E293B";
  let cardBorder = light ? "#E2E8F0" : "rgba(255,255,255,0.09)";
  let cardShadow = "none";
  let opacity = locked ? 0.45 : 1;

  if (claimed) {
    cardBg = light ? "#ECFDF5" : "rgba(52,211,153,0.1)";
    cardBorder = `${MINT}45`;
  } else if (claimable) {
    cardBorder = BLUE;
    cardShadow = `0 0 18px ${BLUE}45, 0 4px 12px rgba(0,0,0,0.15)`;
    opacity = 1;
  }

  // Short name (max 12 chars with ellipsis if needed)
  const shortLabel = reward.label.length > 14 ? reward.label.slice(0, 13) + "…" : reward.label;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - CARD_W / 2,
        top,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 16,
        border: `2px solid ${cardBorder}`,
        backgroundColor: cardBg,
        boxShadow: cardShadow,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        zIndex: claimable ? 15 : claimed ? 12 : 10,
        transition: "opacity 0.2s",
      }}
    >
      {/* Level tag */}
      <div style={{
        marginTop: 8,
        fontSize: 9,
        fontWeight: 800,
        color: claimed ? MINT : claimable ? BLUE : (light ? "#94A3B8" : "rgba(255,255,255,0.35)"),
        letterSpacing: "0.04em",
      }}>
        LV.{reward.level}
      </div>

      {/* Exclusive dot */}
      {isExclusive && (
        <div style={{
          position: "absolute", top: 6, right: 6,
          width: 6, height: 6, borderRadius: "50%",
          backgroundColor: accent, boxShadow: `0 0 5px ${accent}`,
        }} />
      )}

      {/* Icon area */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 8px",
      }}>
        {locked ? (
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
            stroke={light ? "#CBD5E1" : "rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          <RewardIcon reward={reward} size={46} />
        )}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: claimed ? "#22C55E" : claimable ? (light ? "#0F172A" : "#ffffff") : (light ? "#64748B" : "rgba(255,255,255,0.5)"),
        textAlign: "center",
        lineHeight: 1.25,
        padding: "0 6px",
        maxWidth: CARD_W,
        wordBreak: "break-word",
      }}>
        {shortLabel}
      </div>

      {/* Action row */}
      <div style={{ paddingBottom: 8, paddingTop: 5, width: "100%", display: "flex", justifyContent: "center" }}>
        {claimed ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            backgroundColor: `${MINT}20`, borderRadius: 8, padding: "3px 8px",
          }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#22C55E" }}>Claimed</span>
          </div>
        ) : claimable ? (
          <button
            disabled={claimingLevel !== null}
            onClick={() => onClaim(reward.level)}
            style={{
              backgroundColor: BLUE,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "4px 14px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: `0 2px 8px ${BLUE}60`,
              transition: "opacity 0.15s, transform 0.1s",
              opacity: claimingLevel !== null ? 0.5 : 1,
            }}
            className="active:scale-95 hover:opacity-90"
          >
            {claimingLevel === reward.level ? "…" : "Claim"}
          </button>
        ) : locked ? (
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: light ? "#CBD5E1" : "rgba(255,255,255,0.2)",
          }}>
            {reward.level} needed
          </span>
        ) : null}
      </div>

      {/* Claimable pulse border */}
      {claimable && (
        <div
          className="absolute inset-0 rounded-2xl animate-ping"
          style={{ border: `2px solid ${BLUE}50`, pointerEvents: "none" }}
        />
      )}
    </div>
  );
}

// ── Main battle-pass track ────────────────────────────────────────────────────

function BattlePassTrack({
  currentLevel,
  profile,
  light,
  claimingLevel,
  onClaim,
}: {
  currentLevel: number;
  profile: UserProfile;
  light: boolean;
  claimingLevel: number | null;
  onClaim: (level: number) => Promise<void>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Player position on track
  const leftIdx = LEVEL_REWARDS.reduce((best, r, i) => (r.level <= currentLevel ? i : best), 0);
  const rightIdx = Math.min(leftIdx + 1, LEVEL_REWARDS.length - 1);
  const leftNode = LEVEL_REWARDS[leftIdx];
  const rightNode = LEVEL_REWARDS[rightIdx];
  const t = leftNode.level === rightNode.level
    ? 1
    : Math.min(1, (currentLevel - leftNode.level) / (rightNode.level - leftNode.level));
  const playerX = PAD + leftIdx * STEP + t * STEP;

  const totalWidth = PAD * 2 + (LEVEL_REWARDS.length - 1) * STEP;

  useEffect(() => {
    if (!scrollRef.current) return;
    const c = scrollRef.current;
    // Find first claimable or current position
    const firstClaimableIdx = LEVEL_REWARDS.findIndex(
      (r) => currentLevel >= r.level && !isLevelRewardClaimed(r.level, profile)
    );
    const scrollToX = firstClaimableIdx >= 0
      ? PAD + firstClaimableIdx * STEP
      : playerX;
    c.scrollLeft = Math.max(0, scrollToX - c.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trackBg = light ? "#E2E8F0" : "rgba(255,255,255,0.08)";

  return (
    <div
      ref={scrollRef}
      style={{
        overflowX: "auto",
        overflowY: "visible",
        scrollbarWidth: "thin",
        scrollbarColor: light ? "#CBD5E1 transparent" : "rgba(255,255,255,0.12) transparent",
      }}
    >
      <div style={{ width: totalWidth, height: TOTAL_H, position: "relative", paddingTop: 2 }}>

        {/* ── Base track bar ── */}
        <div style={{
          position: "absolute",
          top: TRACK_CY - TRACK_BAR_H / 2,
          left: PAD,
          right: PAD,
          height: TRACK_BAR_H,
          borderRadius: TRACK_BAR_H,
          backgroundColor: trackBg,
        }} />

        {/* ── Filled progress bar ── */}
        <div style={{
          position: "absolute",
          top: TRACK_CY - TRACK_BAR_H / 2,
          left: PAD,
          width: Math.max(0, playerX - PAD),
          height: TRACK_BAR_H,
          borderRadius: TRACK_BAR_H,
          background: `linear-gradient(90deg, ${MINT}, ${BLUE})`,
          boxShadow: `0 0 10px ${BLUE}60`,
        }} />

        {/* ── Player avatar ── */}
        <div style={{
          position: "absolute",
          left: playerX,
          top: TRACK_CY - NODE_R - 44,
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          zIndex: 30, pointerEvents: "none",
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${BLUE}, ${MINT})`,
            borderRadius: 12, padding: 2.5,
            boxShadow: `0 0 14px ${BLUE}80`,
          }}>
            <InkAvatar config={profile.avatar_config} size={34} />
          </div>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#fff",
            backgroundColor: BLUE, borderRadius: 10,
            padding: "1px 7px", boxShadow: `0 2px 6px ${BLUE}70`,
          }}>
            Lv.{currentLevel}
          </div>
          <div style={{ width: 2, height: 8, backgroundColor: BLUE, borderRadius: 2, opacity: 0.7 }} />
        </div>

        {/* ── Reward cards + nodes ── */}
        {LEVEL_REWARDS.map((reward, idx) => {
          const cx = PAD + idx * STEP;
          const claimed = isLevelRewardClaimed(reward.level, profile);
          const reachable = currentLevel >= reward.level;
          const claimable = reachable && !claimed;
          const locked = !reachable;
          const above = idx % 2 === 0;
          const accent = rewardAccent(reward);

          // Stem connecting card to node
          const stemTop = above ? ABOVE_H : TRACK_CY + NODE_R;
          const stemColor = claimed ? MINT : claimable ? BLUE : (light ? "#E2E8F0" : "rgba(255,255,255,0.1)");

          // Node dot color
          let nodeBg = light ? "#E2E8F0" : "rgba(255,255,255,0.1)";
          let nodeBorder = light ? "#CBD5E1" : "rgba(255,255,255,0.15)";
          if (claimed) { nodeBg = `${MINT}30`; nodeBorder = `${MINT}70`; }
          else if (claimable) { nodeBg = `${BLUE}25`; nodeBorder = BLUE; }

          return (
            <div key={reward.level}>
              {/* Stem */}
              <div style={{
                position: "absolute",
                left: cx - 1,
                top: stemTop,
                width: 2,
                height: STEM_H,
                backgroundColor: stemColor,
                borderRadius: 2,
                zIndex: 8,
              }} />

              {/* Node circle */}
              <div style={{
                position: "absolute",
                left: cx - NODE_R,
                top: TRACK_CY - NODE_R,
                width: NODE_R * 2,
                height: NODE_R * 2,
                borderRadius: "50%",
                backgroundColor: nodeBg,
                border: `2px solid ${nodeBorder}`,
                zIndex: 20,
                boxShadow: claimable ? `0 0 10px ${BLUE}60` : "none",
              }}>
                {claimed && (
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={MINT}
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {claimable && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: `${BLUE}30`, border: `1.5px solid ${BLUE}60` }}
                  />
                )}
              </div>

              {/* Card */}
              <TrackCard
                reward={reward}
                cx={cx}
                above={above}
                claimed={claimed}
                claimable={claimable}
                locked={locked}
                claimingLevel={claimingLevel}
                light={light}
                onClaim={onClaim}
              />
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
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
  const levelProgress = getLevelProgress(profile.xp);
  const currentLevel = levelProgress.level;

  useEffect(() => {
    async function load() {
      if (user) {
        const { syncProfileForUser } = await import("@/lib/user/profile-sync");
        const synced = await syncProfileForUser(user.id, user.email ?? "");
        setProfile(synced);
      } else {
        setProfile(getProfile() ?? createGuestProfile());
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    const onProfileUpdated = () => {
      setProfile(getProfile() ?? createGuestProfile());
    };
    window.addEventListener("ll-profile-updated", onProfileUpdated);
    return () => window.removeEventListener("ll-profile-updated", onProfileUpdated);
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
      if (updated) setProfile(updated);
      if (user && updated) {
        try {
          await syncCurrentProfile(user.id);
        } catch (e) {
          console.warn("[Levels] Sync failed after claim:", e);
        }
      }
    } finally {
      setClaimingLevel(null);
    }
  }

  const claimableCount = LEVEL_REWARDS.filter(
    (r) => currentLevel >= r.level && !isLevelRewardClaimed(r.level, profile)
  ).length;
  const claimedCount = LEVEL_REWARDS.filter((r) => isLevelRewardClaimed(r.level, profile)).length;

  const nextReward = LEVEL_REWARDS.find((r) => r.level > currentLevel);
  const xpToNextReward = nextReward ? Math.max(0, getXPForLevel(nextReward.level) - profile.xp) : null;

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

      <div className="flex-1 px-4 sm:px-5 py-4 max-w-3xl mx-auto w-full space-y-5">

        {/* ── Level progress card ── */}
        <div className={`rounded-2xl p-5 ${cardBg} border ${cardBorder} relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-20 pointer-events-none">
            <InkAvatar
              config={{ base: "droplet_03", color: BLUE, eyes: "eyes_05", accessory: "wizard_01", aura: "aura_glow_02", aura_color: BLUE }}
              size={88}
            />
          </div>

          {/* Level + XP row */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-2xl text-white"
              style={{ backgroundColor: BLUE, boxShadow: `0 4px 16px ${BLUE}55` }}
            >
              {currentLevel}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-extrabold ${text}`}>Level {currentLevel}</p>
              <p className={`text-sm font-semibold ${textMuted}`}>
                {levelProgress.xpInLevel.toLocaleString()} / {levelProgress.xpNeededForLevel.toLocaleString()} XP
                <span className={`ml-2 ${textFaint}`}>to Lv.{currentLevel + 1}</span>
              </p>
            </div>
            {claimableCount > 0 && (
              <span
                className="shrink-0 text-sm font-extrabold px-3 py-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: `${BLUE}20`, color: BLUE }}
              >
                {claimableCount} ready
              </span>
            )}
          </div>

          {/* XP progress bar — large */}
          <div className={`w-full h-4 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${levelProgress.progressPercent}%`,
                background: `linear-gradient(90deg, ${MINT}, ${BLUE})`,
                boxShadow: `0 0 10px ${BLUE}60`,
              }}
            />
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between mt-3">
            <p className={`text-xs font-semibold ${textFaint}`}>
              {claimedCount} / {LEVEL_REWARDS.length} rewards claimed
            </p>
            {nextReward && xpToNextReward !== null && (
              <p className={`text-xs font-semibold ${textFaint}`}>
                {xpToNextReward > 0
                  ? `${xpToNextReward.toLocaleString()} XP to Lv.${nextReward.level} reward`
                  : `Lv.${nextReward.level} reward ready!`}
              </p>
            )}
          </div>
        </div>

        {/* ── Battle-pass reward track ── */}
        <div className={`rounded-2xl ${cardBg} border ${cardBorder} overflow-hidden`}>
          <div className={`px-5 pt-4 pb-3 flex items-center justify-between border-b ${cardBorder}`}>
            <div>
              <p className={`text-sm font-extrabold ${text}`}>Reward Track</p>
              <p className={`text-xs font-semibold ${textMuted}`}>
                Exclusive cosmetics marked with a colored dot · scroll to explore
              </p>
            </div>
            <p className={`text-xs font-semibold ${textFaint}`}>
              Lv.1 → Lv.50
            </p>
          </div>
          <div className="px-0 py-4" style={{ overflowX: "clip" }}>
            <BattlePassTrack
              currentLevel={currentLevel}
              profile={profile}
              light={light}
              claimingLevel={claimingLevel}
              onClaim={handleClaim}
            />
          </div>
        </div>

        <p className={`text-center text-xs font-semibold pb-4 ${textFaint}`}>
          Earn XP by playing ranked and casual matches
        </p>
      </div>

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
