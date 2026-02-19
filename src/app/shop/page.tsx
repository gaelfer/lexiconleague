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
} from "@/lib/storage";
import {
  BASES,
  COLORS,
  EYES,
  ACCESSORIES,
  AURAS,
  CosmeticItem,
  ColorItem,
  FREE_ITEM_IDS,
} from "@/lib/cosmetics/catalog";
import {
  canClaimDailyReward,
  claimDailyReward,
  getCurrentStreakDay,
  getTodayReward,
  DAILY_REWARDS,
} from "@/lib/daily-rewards";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import ThemeToggle from "@/components/ThemeToggle";

type ShopTab = "daily" | "bases" | "colors" | "eyes" | "accessories" | "auras";

const TABS: { id: ShopTab; label: string }[] = [
  { id: "daily", label: "Daily" },
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
  const [tab, setTab] = useState<ShopTab>("daily");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [claimAnimating, setClaimAnimating] = useState(false);
  const [confirmItem, setConfirmItem] = useState<(CosmeticItem | ColorItem) | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/auth/signup?from=shop";
      return;
    }
    let p = getProfile();
    if (!p) p = createGuestProfile();
    if (!p.unlocked_items) p.unlocked_items = [...FREE_ITEM_IDS];
    if (p.ink_drops === undefined) p.ink_drops = 0;
    setProfile(p);
  }, [user, authLoading]);

  const showToast = useCallback((type: "success" | "error" | "info", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function refreshProfile() {
    const p = getProfile();
    if (p) setProfile({ ...p });
  }

  function handleClaim() {
    if (!profile || !canClaimDailyReward(profile)) return;
    setClaimAnimating(true);
    const { updatedProfile, reward } = claimDailyReward(profile);
    setTimeout(() => {
      setProfile({ ...updatedProfile });
      showToast("success", `+${reward.drops} Ink Drops!${reward.bonus ? ` ${reward.bonus}` : ""}`);
      setClaimAnimating(false);
    }, 600);
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

  function renderItemCard(item: CosmeticItem | ColorItem) {
    const owned = isItemUnlocked(item.id, profile);
    const canAfford = (profile?.ink_drops ?? 0) >= item.price;
    const isFree = item.price === 0;
    const isColor = "hex" in item;

    return (
      <button
        key={item.id}
        onClick={() => !owned && !isFree && handleBuy(item)}
        disabled={owned || isFree}
        className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
          owned || isFree
            ? light ? "border-[#34D399]/50 bg-[#ECFDF5]" : "border-[#34D399]/50 bg-[#34D399]/10"
            : canAfford
            ? light ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6] hover:bg-[#DBEAFE]/50 cursor-pointer" : "border-[#334155] bg-[#1E293B]/50 hover:border-[#3B82F6] hover:bg-[#3B82F6]/20 cursor-pointer"
            : light ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-60 cursor-not-allowed" : "border-[#334155] bg-[#0F172A]/50 opacity-60 cursor-not-allowed"
        }`}
      >
        {isColor ? (
          <div
            className="w-14 h-14 rounded-full shadow-lg border-2 border-white/20"
            style={{ backgroundColor: (item as ColorItem).hex }}
          />
        ) : (
          <div className="w-14 h-14 flex items-center justify-center">
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
        <span className={`text-sm font-bold ${light ? "text-[#0F172A]" : "text-white"}`}>{item.label}</span>
        {owned || isFree ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: MINT }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Owned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: MINT }}>
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
          <ThemeToggle />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${light ? "bg-[#ECFDF5] border border-[#34D399]/30" : "bg-[#1E293B] border border-[#334155]"}`}>
            <InkDropIcon className="w-5 h-5" color={MINT} />
            <span className="text-base font-bold" style={{ color: MINT }}>{profile.ink_drops ?? 0}</span>
          </div>
        </div>
      </header>

      <div className="relative flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 min-w-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? light ? "bg-[#3B82F6] text-white" : "bg-[#3B82F6] text-white"
                  : light ? "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#3B82F6]/50 hover:text-[#0F172A]" : "bg-[#1E293B]/80 text-[#94A3B8] border border-[#334155] hover:border-[#3B82F6]/50 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={`rounded-2xl overflow-hidden ${cardBg} border ${cardBorder}`}>
          {tab === "daily" && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h2 className={`text-2xl font-bold mb-2 ${text}`}>Daily Reward</h2>
                <p className={`${textMuted} text-sm`}>Claim every day. 7-day streak = bonus.</p>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 max-w-lg mx-auto">
                {DAILY_REWARDS.map((reward, i) => {
                  const dayNum = i + 1;
                  const isPast = dayNum < streakDay || (dayNum === streakDay && !canClaim);
                  const isToday = dayNum === streakDay && canClaim;

                  return (
                    <div
                      key={dayNum}
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all ${
                        isPast
                          ? light ? "border-[#34D399]/50 bg-[#ECFDF5]" : "border-[#34D399]/50 bg-[#34D399]/20"
                          : isToday
                          ? light ? "border-[#34D399] bg-[#ECFDF5] shadow-lg scale-105" : "border-[#34D399] bg-[#34D399]/20 shadow-lg scale-105"
                          : light ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-50" : "border-[#334155] bg-[#0F172A]/50 opacity-50"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${textFaint}`}>{reward.label}</span>
                      <div className="flex items-center gap-0.5 mt-1">
                        <InkDropIcon className="w-4 h-4" color={MINT} />
                        <span className="text-sm font-bold" style={{ color: MINT }}>{reward.drops}</span>
                      </div>
                      {isPast && <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 mt-0.5 ${light ? "text-[#059669]" : "text-[#34D399]"}`}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      {reward.bonus && <span className="text-[8px] font-bold mt-0.5" style={{ color: MINT }}>{reward.bonus}</span>}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleClaim}
                  disabled={!canClaim || claimAnimating}
                  className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${
                    canClaim && !claimAnimating
                      ? "text-white hover:opacity-90"
                      : light ? "bg-[#E2E8F0] text-[#64748B] cursor-not-allowed" : "bg-[#334155] text-[#64748B] cursor-not-allowed"
                  }`}
                  style={canClaim && !claimAnimating ? { backgroundColor: MINT } : {}}
                >
                  {claimAnimating ? "Claiming..." : canClaim ? `Claim +${todayReward.drops} Ink Drops` : "Come back tomorrow!"}
                </button>
                <p className={`text-sm font-medium ${textMuted}`}>Streak: {profile.daily_streak ?? 0} day{(profile.daily_streak ?? 0) !== 1 ? "s" : ""}</p>
              </div>

              <div className={`rounded-xl p-4 max-w-md mx-auto ${light ? "bg-[#F8FAFC] border border-[#E2E8F0]" : "bg-[#0F172A]/80 border border-[#334155]"}`}>
                <h3 className={`text-sm font-bold mb-2 ${text}`}>Earn Ink Drops</h3>
                <ul className={`space-y-2 text-sm ${textMuted}`}>
                  <li className="flex items-center gap-2"><InkDropIcon className="w-4 h-4 shrink-0" color={MINT} /><span><strong className={text}>+2</strong> per correct answer</span></li>
                  <li className="flex items-center gap-2"><InkDropIcon className="w-4 h-4 shrink-0" color={MINT} /><span><strong className={text}>+5</strong> bonus for ranked wins</span></li>
                </ul>
              </div>
            </div>
          )}

          {tab === "bases" && (
            <div className="p-6">
              <p className={`${textFaint} text-xs font-bold uppercase tracking-wider mb-4`}>Ink Shapes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{BASES.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "colors" && (
            <div className="p-6">
              <p className={`${textFaint} text-xs font-bold uppercase tracking-wider mb-4`}>Ink Colors</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">{COLORS.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "eyes" && (
            <div className="p-6">
              <p className={`${textFaint} text-xs font-bold uppercase tracking-wider mb-4`}>Expressions</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{EYES.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "accessories" && (
            <div className="p-6">
              <p className={`${textFaint} text-xs font-bold uppercase tracking-wider mb-4`}>Gear & Accessories</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{ACCESSORIES.map(renderItemCard)}</div>
            </div>
          )}

          {tab === "auras" && (
            <div className="p-6">
              <p className={`${textFaint} text-xs font-bold uppercase tracking-wider mb-4`}>Auras</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{AURAS.map(renderItemCard)}</div>
            </div>
          )}
        </div>
      </div>

      {confirmItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl p-6 max-w-sm w-full ${light ? "bg-white border border-[#E2E8F0]" : "bg-[#1E293B] border border-[#334155]"}`}>
            <h3 className={`text-lg font-bold text-center mb-4 ${text}`}>Unlock {confirmItem.label}?</h3>
            <div className="flex items-center justify-center gap-2 mb-6" style={{ color: MINT }}>
              <InkDropIcon className="w-6 h-6" color={MINT} />
              <span className="text-2xl font-bold">{confirmItem.price}</span>
              <span className={`text-sm ${textMuted}`}>Ink Drops</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmItem(null)} className={`flex-1 py-3 rounded-xl font-bold ${light ? "text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9]" : "text-[#94A3B8] bg-[#0F172A] border border-[#334155] hover:bg-[#1E293B]"} transition-colors`}>
                Cancel
              </button>
              <button onClick={confirmPurchase} className="flex-1 py-3 rounded-xl font-bold text-white transition-colors" style={{ backgroundColor: MINT }}>
                Buy
              </button>
            </div>
            <p className={`text-[10px] text-center mt-3 ${textFaint}`}>Balance after: {(profile?.ink_drops ?? 0) - confirmItem.price}</p>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl z-50 ${
            toast.type === "success" ? "bg-[#22C55E] text-white" : toast.type === "error" ? "bg-[#EF4444] text-white" : "bg-[#3B82F6] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
