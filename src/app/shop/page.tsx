"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
  colorHexToId,
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

type ShopTab = "daily" | "bases" | "colors" | "eyes" | "accessories" | "auras";

const TABS: { id: ShopTab; label: string }[] = [
  { id: "daily", label: "Daily Reward" },
  { id: "bases", label: "Bases" },
  { id: "colors", label: "Colors" },
  { id: "eyes", label: "Eyes" },
  { id: "accessories", label: "Gear" },
  { id: "auras", label: "Auras" },
];

export default function ShopPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<ShopTab>("daily");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);
  const [claimAnimating, setClaimAnimating] = useState(false);
  const [confirmItem, setConfirmItem] = useState<
    (CosmeticItem | ColorItem) | null
  >(null);

  useEffect(() => {
    let p = getProfile();
    if (!p) p = createGuestProfile();
    if (!p.unlocked_items) p.unlocked_items = [...FREE_ITEM_IDS];
    if (p.ink_drops === undefined) p.ink_drops = 0;
    setProfile(p);
  }, []);

  const showToast = useCallback(
    (type: "success" | "error" | "info", msg: string) => {
      setToast({ type, msg });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

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
      showToast(
        "success",
        `+${reward.drops} Ink Drops claimed!${reward.bonus ? ` ${reward.bonus}` : ""}`
      );
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
        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
          owned || isFree
            ? "border-[#22C55E]/40 bg-[#ECFDF5]"
            : canAfford
            ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6] hover:shadow-md cursor-pointer"
            : "border-[#E2E8F0] bg-[#F8FAFC] opacity-60 cursor-not-allowed"
        }`}
      >
        {/* Preview */}
        {isColor ? (
          <div
            className="w-12 h-12 rounded-full shadow-inner border border-[#E2E8F0]"
            style={{ backgroundColor: (item as ColorItem).hex }}
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center">
            {item.category === "base" && (
              <InkAvatar
                config={{ base: item.id, color: "#1E293B", eyes: "eyes_01", accessory: "none", aura: "none" }}
                size="sm"
              />
            )}
            {item.category === "eyes" && (
              <InkAvatar
                config={{ base: "droplet_01", color: "#1E293B", eyes: item.id, accessory: "none", aura: "none" }}
                size="sm"
              />
            )}
            {item.category === "accessory" && (
              <InkAvatar
                config={{ base: "droplet_01", color: "#1E293B", eyes: "eyes_01", accessory: item.id, aura: "none" }}
                size="sm"
              />
            )}
            {item.category === "aura" && (
              <InkAvatar
                config={{ base: "droplet_01", color: "#3B82F6", eyes: "eyes_01", accessory: "none", aura: item.id }}
                size="sm"
              />
            )}
          </div>
        )}

        <span className="text-xs font-bold text-[#0F172A]">{item.label}</span>

        {/* Price tag */}
        {owned || isFree ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E]">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Owned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B82F6]">
            <InkDropIcon className="w-3 h-3" />
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
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#64748B] font-semibold animate-pulse">
          Loading shop...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-sm font-bold transition-colors"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-lg font-extrabold text-[#0F172A]">
          <SparkIcon
            className="w-5 h-5 inline-block mr-1.5 -mt-0.5"
            color="#3B82F6"
          />
          Ink Shop
        </h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DBEAFE] border border-[#3B82F6]/20">
          <InkDropIcon className="w-4 h-4" color="#3B82F6" />
          <span className="text-sm font-extrabold text-[#3B82F6]">
            {profile.ink_drops ?? 0}
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-[#3B82F6] text-white shadow-md"
                  : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:border-[#3B82F6] hover:text-[#3B82F6]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5">
          {/* ── Daily Reward ────────────────────────────────────────── */}
          {tab === "daily" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-extrabold text-[#0F172A] mb-1">
                  Daily Ink Drop Reward
                </h2>
                <p className="text-sm text-[#64748B] font-medium">
                  Come back every day to earn Ink Drops. 7-day streak = big
                  bonus!
                </p>
              </div>

              {/* Streak calendar */}
              <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto">
                {DAILY_REWARDS.map((reward, i) => {
                  const dayNum = i + 1;
                  const isPast =
                    dayNum < streakDay ||
                    (dayNum === streakDay && !canClaim);
                  const isToday = dayNum === streakDay && canClaim;
                  const isFuture = dayNum > streakDay || (dayNum === streakDay && !canClaim && dayNum !== streakDay);

                  return (
                    <div
                      key={dayNum}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        isPast
                          ? "border-[#22C55E]/40 bg-[#ECFDF5]"
                          : isToday
                          ? "border-[#3B82F6] bg-[#DBEAFE] shadow-md scale-105"
                          : "border-[#E2E8F0] bg-white opacity-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">
                        {reward.label}
                      </span>
                      <div className="flex items-center gap-0.5 mt-1">
                        <InkDropIcon className="w-3.5 h-3.5" color={isPast ? "#22C55E" : "#3B82F6"} />
                        <span
                          className={`text-sm font-extrabold ${
                            isPast ? "text-[#22C55E]" : "text-[#3B82F6]"
                          }`}
                        >
                          {reward.drops}
                        </span>
                      </div>
                      {isPast && (
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-[#22C55E] mt-0.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {reward.bonus && (
                        <span className="text-[8px] font-bold text-[#EAB308] mt-0.5">
                          {reward.bonus}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Claim button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleClaim}
                  disabled={!canClaim || claimAnimating}
                  className={`px-8 py-4 rounded-2xl font-extrabold text-lg transition-all shadow-lg ${
                    canClaim && !claimAnimating
                      ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white hover:shadow-xl hover:-translate-y-0.5"
                      : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none"
                  } ${claimAnimating ? "animate-pulse scale-110" : ""}`}
                >
                  {claimAnimating
                    ? "Claiming..."
                    : canClaim
                    ? `Claim +${todayReward.drops} Ink Drops`
                    : "Come back tomorrow!"}
                </button>
                <p className="text-xs text-[#64748B] font-medium">
                  Streak: {profile.daily_streak ?? 0} day
                  {(profile.daily_streak ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Earn info */}
              <div className="rounded-2xl bg-white border border-[#E2E8F0] p-4 max-w-md mx-auto">
                <h3 className="text-sm font-extrabold text-[#0F172A] mb-2">
                  Other ways to earn Ink Drops
                </h3>
                <ul className="space-y-1.5 text-xs text-[#64748B] font-medium">
                  <li className="flex items-center gap-2">
                    <InkDropIcon className="w-3.5 h-3.5 shrink-0" color="#3B82F6" />
                    <span>
                      <strong className="text-[#0F172A]">+2 per correct answer</strong> in
                      any game mode
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <InkDropIcon className="w-3.5 h-3.5 shrink-0" color="#3B82F6" />
                    <span>
                      <strong className="text-[#0F172A]">+5 bonus</strong> for
                      winning a ranked match
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Bases ────────────────────────────────────────────── */}
          {tab === "bases" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Ink Shapes
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {BASES.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* ── Colors ───────────────────────────────────────────── */}
          {tab === "colors" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Ink Colors
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {COLORS.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* ── Eyes ─────────────────────────────────────────────── */}
          {tab === "eyes" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Expressions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EYES.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* ── Accessories ──────────────────────────────────────── */}
          {tab === "accessories" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Gear & Accessories
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ACCESSORIES.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* ── Auras ────────────────────────────────────────────── */}
          {tab === "auras" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Auras
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AURAS.map(renderItemCard)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase confirmation modal */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-extrabold text-[#0F172A] text-center">
              Unlock {confirmItem.label}?
            </h3>
            <div className="flex items-center justify-center gap-2 text-[#3B82F6]">
              <InkDropIcon className="w-5 h-5" />
              <span className="text-xl font-extrabold">{confirmItem.price}</span>
              <span className="text-sm font-medium text-[#64748B]">
                Ink Drops
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-3 rounded-2xl font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-lg transition-all"
              >
                Buy
              </button>
            </div>
            <p className="text-[10px] text-[#64748B] text-center">
              Balance after: {(profile?.ink_drops ?? 0) - confirmItem.price} Ink
              Drops
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all z-50 ${
            toast.type === "success"
              ? "bg-[#22C55E] text-white"
              : toast.type === "error"
              ? "bg-[#EF4444] text-white"
              : "bg-[#3B82F6] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
