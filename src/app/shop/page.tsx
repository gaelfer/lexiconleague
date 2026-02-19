"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { UserProfile } from "@/types";
import {
  getProfile,
  createGuestProfile,
  spendInkDrops,
  unlockItem,
  isItemUnlocked,
} from "@/lib/user/storage";
import {
  BASES,
  COLORS,
  EYES,
  ACCESSORIES,
  AURAS,
  CosmeticItem,
  ColorItem,
  FREE_ITEM_IDS,
  isRankReward,
} from "@/lib/cosmetics/catalog";
import { RANK_REWARD_ITEM_IDS } from "@/lib/game/rank";
import { RANK_COLORS, RANK_TIERS, RankTier } from "@/types";
import {
  canClaimDailyReward,
  claimDailyReward,
  getCurrentStreakDay,
  getTodayReward,
  DAILY_REWARDS,
  DailyReward,
} from "@/lib/user/daily-rewards";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";

type ShopTab = "daily" | "bases" | "colors" | "eyes" | "accessories" | "auras";

const TABS: { id: ShopTab; label: string }[] = [
  { id: "bases", label: "Shapes" },
  { id: "colors", label: "Colors" },
  { id: "eyes", label: "Eyes" },
  { id: "accessories", label: "Gear" },
  { id: "auras", label: "Auras" },
];

const BLUE = "#3B82F6";
const MINT = "#34D399";

export default function ShopPage() {
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<ShopTab>("bases");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [claimAnimating, setClaimAnimating] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);
  const [confirmItem, setConfirmItem] = useState<(CosmeticItem | ColorItem) | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/auth/signup?from=shop";
      return;
    }
    async function loadProfile() {
      let p = getProfile();
      if (!p) p = createGuestProfile();
      if (user?.id) {
        const { syncProfileForUser } = await import("@/lib/user/profile-sync");
        p = await syncProfileForUser(user.id, user.email ?? "");
      }
      if (!p.unlocked_items) p.unlocked_items = [...FREE_ITEM_IDS];
      if (p.ink_drops === undefined) p.ink_drops = 0;
      setProfile(p);
    }
    loadProfile();
  }, [user, authLoading]);

  const showToast = useCallback((type: "success" | "error" | "info", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function refreshProfile() {
    const p = getProfile();
    if (p) setProfile({ ...p });
  }

  async function handleClaim() {
    const fresh = getProfile();
    if (!fresh || !canClaimDailyReward(fresh)) return;
    setClaimAnimating(true);
    const result = claimDailyReward(fresh);
    if (!result) {
      setClaimAnimating(false);
      return;
    }
    const { updatedProfile, reward } = result;
    setProfile({ ...updatedProfile });
    setClaimedReward(reward);
    setClaimAnimating(false);
    if (user?.id) {
      const { upsertProfile } = await import("@/lib/supabase/profile");
      await upsertProfile(user.id, updatedProfile);
    }
  }

  function handleBuy(item: CosmeticItem | ColorItem) {
    if (!profile) return;
    if (item.price === 0 || isItemUnlocked(item.id, profile)) {
      showToast("info", "You already own this!");
      return;
    }
    if ((profile.ink_drops ?? 0) < item.price) {
      showToast("error", "Not enough Ink Drops!");
      return;
    }
    setConfirmItem(item);
  }

  function confirmPurchase() {
    if (!confirmItem || !profile) return;
    const success = spendInkDrops(confirmItem.price);
    if (success) {
      unlockItem(confirmItem.id);
      refreshProfile();
      showToast("success", `${confirmItem.label} unlocked!`);
    } else {
      showToast("error", "Purchase failed.");
    }
    setConfirmItem(null);
  }

  function getRankForItem(itemId: string): string | null {
    for (const tier of RANK_TIERS) {
      if (RANK_REWARD_ITEM_IDS[tier].includes(itemId)) return tier;
    }
    return null;
  }

  function renderItemCard(item: CosmeticItem | ColorItem) {
    const owned = isItemUnlocked(item.id, profile);
    const canAfford = (profile?.ink_drops ?? 0) >= item.price && item.price > 0;
    const isFree = item.price === 0;
    const isRankOnly = isRankReward(item);
    const rankTier = isRankOnly ? getRankForItem(item.id) : null;
    const isColor = "hex" in item;

    return (
      <button
        key={item.id}
        onClick={() => !owned && !isFree && !isRankOnly && handleBuy(item)}
        disabled={owned || isFree || isRankOnly}
        className={`group relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border-[3px] transition-all duration-200 active:scale-[0.97] ${
          owned || isFree
            ? light ? "border-[#34D399]/60 bg-[#ECFDF5] shadow-[0_2px_8px_rgba(52,211,153,0.2)]" : "border-[#34D399]/50 bg-[#34D399]/15 shadow-[0_2px_8px_rgba(52,211,153,0.15)]"
            : canAfford
            ? light ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6] hover:shadow-[0_4px_16px_rgba(59,130,246,0.25)] cursor-pointer" : "border-[#334155] bg-[#1E293B]/60 hover:border-[#3B82F6] hover:shadow-[0_4px_16px_rgba(59,130,246,0.2)] cursor-pointer"
            : light ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-60 cursor-not-allowed" : "border-[#334155] bg-[#0F172A]/50 opacity-60 cursor-not-allowed"
        }`}
      >
        {isColor ? (
          <div
            className="w-14 h-14 rounded-2xl shadow-lg border-[3px] border-white/30 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: (item as ColorItem).hex }}
          />
        ) : (
          <div className="w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
            {item.category === "base" && (
              <InkAvatar config={{ base: item.id, color: "#1E293B", eyes: "eyes_01", accessory: "none", aura: "none" }} size="lg" />
            )}
            {item.category === "eyes" && (
              <InkAvatar config={{ base: "droplet_01", color: "#1E293B", eyes: item.id, accessory: "none", aura: "none" }} size="lg" />
            )}
            {item.category === "accessory" && (
              <InkAvatar config={{ base: "droplet_01", color: "#1E293B", eyes: "eyes_01", accessory: item.id, aura: "none" }} size="lg" />
            )}
            {item.category === "aura" && (
              <InkAvatar config={{ base: "droplet_01", color: "#3B82F6", eyes: "eyes_01", accessory: "none", aura: item.id }} size="lg" />
            )}
          </div>
        )}
        <span className={`text-sm font-extrabold ${light ? "text-[#0F172A]" : "text-white"}`}>{item.label}</span>
        {owned || isFree ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl" style={{ color: MINT, backgroundColor: `${MINT}20` }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Owned
          </span>
        ) : isRankOnly && rankTier ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl" style={{ color: RANK_COLORS[rankTier as RankTier], backgroundColor: `${RANK_COLORS[rankTier as RankTier]}30` }}>
            {rankTier === "Bronze" ? "Play Ranked" : `Reach ${rankTier}`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-extrabold px-2.5 py-1 rounded-xl" style={{ color: MINT, backgroundColor: `${MINT}20` }}>
            <InkDropIcon className="w-4 h-4" color={MINT} />
            {item.price}
          </span>
        )}
      </button>
    );
  }

  const canClaim = profile ? canClaimDailyReward(profile) : false;
  const streakDay = profile ? getCurrentStreakDay(profile) : 1;
  const todayReward = profile ? getTodayReward(profile) : DAILY_REWARDS[0];

  if (!profile) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]"}`}>
        <p className={`font-semibold animate-pulse ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>Loading shop...</p>
      </main>
    );
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]/80";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-[#334155]";

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-lg font-bold ${text} flex items-center gap-2`}>
          <SparkIcon className="w-5 h-5" color={MINT} />
          Ink Shop
        </h1>
        <div className="flex items-center gap-2">
          <GlobalNotificationBar />
          <ThemeToggle />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 ${
              light ? "bg-[#ECFDF5] border-[#34D399]/40 shadow-[0_2px_8px_rgba(52,211,153,0.2)]" : "bg-[#1E293B] border-[#34D399]/40 shadow-[0_2px_8px_rgba(52,211,153,0.15)]"
            }`}
          >
            <InkDropIcon className="w-5 h-5" color={MINT} />
            <span className="text-base font-extrabold" style={{ color: MINT }}>{profile.ink_drops ?? 0}</span>
          </div>
        </div>
      </header>

      <div className="relative flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Daily rewards — compact strip (less major) */}
        <div
          className={`rounded-2xl border-2 overflow-hidden ${
            light ? "bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] border-[#34D399]/40" : "bg-gradient-to-r from-[#34D399]/15 to-[#34D399]/10 border-[#34D399]/30"
          }`}
          style={{ boxShadow: light ? "0 2px 12px rgba(52,211,153,0.15)" : "0 2px 12px rgba(52,211,153,0.1)" }}
        >
          <div className="px-4 py-3 flex items-center justify-between gap-4 relative overflow-visible">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${light ? "bg-white/80" : "bg-[#34D399]/20"}`}>
                <InkDropIcon className="w-5 h-5" color={MINT} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${text}`}>Daily reward</p>
                <p className={`text-xs ${textMuted}`}>
                  {canClaim ? `+${todayReward.drops} Ink Drops today` : `Day ${streakDay}/7 · Streak: ${profile.daily_streak ?? 0}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={!canClaim || claimAnimating}
              className={`px-4 py-2 rounded-xl font-bold text-sm shrink-0 transition-all ${
                canClaim && !claimAnimating
                  ? "text-white hover:scale-105"
                  : light ? "bg-[#E2E8F0] text-[#64748B] cursor-not-allowed" : "bg-[#334155] text-[#64748B] cursor-not-allowed"
              }`}
              style={canClaim && !claimAnimating ? { backgroundColor: MINT, boxShadow: "0 2px 8px rgba(52,211,153,0.4)" } : {}}
            >
              {claimAnimating ? "..." : canClaim ? "Claim" : "Tomorrow"}
            </button>
            <div className="absolute -top-2 -right-2 opacity-75 pointer-events-none" style={{ transform: "rotate(8deg)" }}>
              <InkAvatar config={{ base: "droplet_02", color: MINT, eyes: "eyes_03", accessory: "none", aura: "aura_glow_01" }} size={48} />
            </div>
          </div>
        </div>

        {/* Shop tabs — cartoony pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 min-w-0">
          {TABS.filter(t => t.id !== "daily").map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-extrabold whitespace-nowrap transition-all border-2 active:scale-95 ${
                tab === t.id
                  ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-[0_4px_12px_rgba(59,130,246,0.4)]"
                  : light
                  ? "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#3B82F6]/50 hover:text-[#0F172A] hover:shadow-md"
                  : "bg-[#1E293B]/80 text-[#94A3B8] border-[#334155] hover:border-[#3B82F6]/50 hover:text-white hover:shadow-md"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Shop sections — each in its own card, more separated, cartoony */}
        <div className="space-y-5">
          {tab === "bases" && (
            <div
              className={`rounded-3xl overflow-hidden border-2 ${cardBorder}`}
              style={{ boxShadow: light ? "0 4px 20px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)" }}
            >
              <div className={`px-5 py-3 border-b-2 ${cardBorder} ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]/50"} flex items-center justify-between gap-3`}>
                <p className={`text-sm font-extrabold ${text}`}>🫧 Ink Shapes</p>
                <div className="shrink-0 -rotate-[8deg]">
                  <InkAvatar config={{ base: "droplet_01", color: "#EC4899", eyes: "eyes_06", accessory: "bow_01", aura: "aura_glow_02" }} size={36} />
                </div>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{BASES.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "colors" && (
            <div
              className={`rounded-3xl overflow-hidden border-2 ${cardBorder}`}
              style={{ boxShadow: light ? "0 4px 20px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)" }}
            >
              <div className={`px-5 py-3 border-b-2 ${cardBorder} ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]/50"}`}>
                <p className={`text-sm font-extrabold ${text}`}>🎨 Ink Colors</p>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-3 sm:grid-cols-5 gap-4">{COLORS.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "eyes" && (
            <div
              className={`rounded-3xl overflow-hidden border-2 ${cardBorder}`}
              style={{ boxShadow: light ? "0 4px 20px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)" }}
            >
              <div className={`px-5 py-3 border-b-2 ${cardBorder} ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]/50"}`}>
                <p className={`text-sm font-extrabold ${text}`}>👀 Expressions</p>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">{EYES.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "accessories" && (
            <div
              className={`rounded-3xl overflow-hidden border-2 ${cardBorder}`}
              style={{ boxShadow: light ? "0 4px 20px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)" }}
            >
              <div className={`px-5 py-3 border-b-2 ${cardBorder} ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]/50"}`}>
                <p className={`text-sm font-extrabold ${text}`}>🎩 Gear & Accessories</p>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">{ACCESSORIES.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "auras" && (
            <div
              className={`rounded-3xl overflow-hidden border-2 ${cardBorder}`}
              style={{ boxShadow: light ? "0 4px 20px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)" }}
            >
              <div className={`px-5 py-3 border-b-2 ${cardBorder} ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]/50"}`}>
                <p className={`text-sm font-extrabold ${text}`}>✨ Auras</p>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">{AURAS.map(renderItemCard)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Daily reward claimed popup — spacious, mobile-first */}
      {claimedReward && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 overscroll-contain"
          style={{ paddingBottom: "env(safe-area-inset-bottom)", paddingTop: "env(safe-area-inset-top)" }}
          onClick={() => setClaimedReward(null)}
        >
          <div
            className={`rounded-t-3xl sm:rounded-3xl overflow-hidden border-t-[3px] sm:border-[3px] w-full sm:max-w-lg sm:max-h-[90vh] overflow-y-auto flex flex-col ${
              light ? "bg-white border-[#34D399]/50" : "bg-[#1E293B] border-[#34D399]/50"
            }`}
            style={{ boxShadow: "0 8px 32px rgba(52,211,153,0.25)", maxHeight: "min(90vh, 640px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 text-center flex flex-col min-h-0 gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${MINT}25` }}>
                  <InkDropIcon className="w-10 h-10 sm:w-12 sm:h-12" color={MINT} />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${textMuted} mb-1`}>Daily reward</p>
                  <p className={`text-2xl sm:text-4xl font-extrabold ${claimedReward.bonus ? "mb-1" : ""}`} style={{ color: MINT }}>+{claimedReward.drops} Ink Drops</p>
                  {claimedReward.bonus && (
                    <p className="text-sm font-bold mt-1" style={{ color: MINT }}>{claimedReward.bonus}</p>
                  )}
                </div>
              </div>

              {/* Upcoming rewards — claimed + 2 next */}
              <div className="p-4 sm:p-5 rounded-2xl shrink-0" style={{ backgroundColor: light ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.12)", border: "2px solid rgba(52,211,153,0.3)" }}>
                <p className={`text-xs font-extrabold uppercase tracking-wider ${textMuted} mb-3 text-center`}>Upcoming rewards</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {[
                    { r: claimedReward, label: "Claimed", isClaimed: true },
                    { r: DAILY_REWARDS[claimedReward.day % 7], label: "Tomorrow", isClaimed: false },
                    { r: DAILY_REWARDS[(claimedReward.day + 1) % 7], label: "Day after", isClaimed: false },
                  ].map(({ r, label, isClaimed }, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 min-w-[100px] ${
                        isClaimed
                          ? light ? "border-[#34D399] bg-[#ECFDF5] shadow-[0_0_12px_rgba(52,211,153,0.4)]" : "border-[#34D399] bg-[#34D399]/25 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                          : light ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-70" : "border-white/15 bg-[#0F172A]/40 opacity-70"
                      }`}
                    >
                      <span className="text-xs font-extrabold text-center">{label}</span>
                      <span className="text-[10px] font-bold text-center mt-0.5">{r.label}</span>
                      <div className="flex items-center gap-0.5 mt-1.5">
                        <InkDropIcon className="w-4 h-4 shrink-0" color={MINT} />
                        <span className="text-sm font-extrabold" style={{ color: MINT }}>{r.drops}</span>
                      </div>
                      {isClaimed && (
                        <span className="text-[10px] font-extrabold mt-1" style={{ color: MINT }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setClaimedReward(null)}
                className="w-full py-4 sm:py-4 rounded-2xl font-extrabold text-white transition-all active:scale-95 shrink-0 touch-manipulation"
                style={{ backgroundColor: MINT, boxShadow: "0 4px 12px rgba(52,211,153,0.4)", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                Nice!
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-3xl shadow-2xl p-6 max-w-sm w-full border-[3px] ${
              light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-[#334155]"
            }`}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          >
            <h3 className={`text-lg font-extrabold text-center mb-4 ${text}`}>Unlock {confirmItem.label}?</h3>
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-2xl" style={{ backgroundColor: `${MINT}15`, border: `2px solid ${MINT}40` }}>
              <InkDropIcon className="w-6 h-6" color={MINT} />
              <span className="text-2xl font-extrabold" style={{ color: MINT }}>{confirmItem.price}</span>
              <span className={`text-sm font-bold ${textMuted}`}>Ink Drops</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmItem(null)} className={`flex-1 py-3 rounded-2xl font-extrabold border-2 transition-all active:scale-95 ${light ? "text-[#64748B] bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]" : "text-[#94A3B8] bg-[#0F172A] border-[#334155] hover:bg-[#1E293B]"} `}>
                Cancel
              </button>
              <button onClick={confirmPurchase} className="flex-1 py-3 rounded-2xl font-extrabold text-white transition-all active:scale-95" style={{ backgroundColor: MINT, boxShadow: "0 4px 12px rgba(52,211,153,0.4)" }}>
                Buy
              </button>
            </div>
            <p className={`text-[10px] font-semibold text-center mt-3 ${textFaint}`}>Balance after: {(profile?.ink_drops ?? 0) - confirmItem.price}</p>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-extrabold text-sm shadow-xl z-50 border-2 ${
            toast.type === "success" ? "bg-[#22C55E] text-white border-[#16A34A]" : toast.type === "error" ? "bg-[#EF4444] text-white border-[#DC2626]" : "bg-[#3B82F6] text-white border-[#2563EB]"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
