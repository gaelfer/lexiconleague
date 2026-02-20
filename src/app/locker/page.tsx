"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { InkAvatarConfig, DEFAULT_AVATAR_CONFIG, UserProfile } from "@/types";
import { getProfile, saveProfile, isItemUnlocked } from "@/lib/user/storage";
import { fetchAvatarConfig, updateAvatarConfig } from "@/lib/supabase/avatar";
import { syncProfileForUser } from "@/lib/user/profile-sync";
import {
  BASES,
  COLORS,
  EYES,
  ACCESSORIES,
  CosmeticItem,
  ColorItem,
  colorHexToId,
  FREE_ITEM_IDS,
  getOwnedAuraVariants,
  AuraVariant,
  RARITY_COLORS,
  RARITY_LABELS,
} from "@/lib/cosmetics/catalog";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";

type Tab = "base" | "color" | "eyes" | "accessory" | "aura";

const TABS: { id: Tab; label: string }[] = [
  { id: "base", label: "Base" },
  { id: "color", label: "Color" },
  { id: "eyes", label: "Eyes" },
  { id: "accessory", label: "Gear" },
  { id: "aura", label: "Aura" },
];

export default function LockerPage() {
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const [config, setConfig] = useState<InkAvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });
  const [savedConfig, setSavedConfig] = useState<InkAvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("base");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/auth/signup?from=locker";
      return;
    }
    async function load() {
      try {
        const synced = await syncProfileForUser(user!.id, user!.email ?? "");
        setProfile(synced);
        const remote = await fetchAvatarConfig(user!.id);
        setConfig(remote);
        setSavedConfig(remote);
      } catch {
        const p = getProfile();
        setProfile(p);
        const remote = await fetchAvatarConfig(user!.id);
        setConfig(remote);
        setSavedConfig(remote);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading]);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  async function handleSave() {
    setSaving(true);
    if (user) {
      const result = await updateAvatarConfig(user.id, config);
      if (result.success) {
        setSavedConfig(config);
        const p = getProfile();
        if (p) {
          p.avatar_config = config;
          saveProfile(p);
        }
        showToast("success", "Avatar saved!");
      } else {
        showToast("error", result.error ?? "Failed to save.");
      }
    } else {
      const p = getProfile();
      if (p) {
        p.avatar_config = config;
        saveProfile(p);
        setSavedConfig(config);
        showToast("success", "Avatar saved locally!");
      }
    }
    setSaving(false);
  }

  function update(patch: Partial<InkAvatarConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  function checkUnlocked(itemId: string): boolean {
    return isItemUnlocked(itemId, profile);
  }

  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const previewSurface = light
    ? "bg-[#F8FAFC] border-[#E2E8F0]"
    : "bg-[#0B1220] border-white/20";

  function renderLockerItem(
    item: CosmeticItem | ColorItem,
    isSelected: boolean,
    onClick: () => void,
    preview: React.ReactNode
  ) {
    const unlocked = checkUnlocked(item.id);
    return (
      <button
        key={item.id}
        onClick={unlocked ? onClick : undefined}
        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
          !unlocked
            ? light ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-50 cursor-not-allowed" : "border-white/10 bg-[#0F172A]/50 opacity-50 cursor-not-allowed"
            : isSelected
            ? light ? "border-[#3B82F6] bg-[#DBEAFE] shadow-md" : "border-[#3B82F6] bg-[#3B82F6]/20 shadow-md"
            : light ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6]/50" : "border-white/10 bg-[#0F172A]/50 hover:border-[#3B82F6]/50"
        }`}
      >
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Link
              href="/shop"
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${light ? "bg-[#0F172A]/90 text-white hover:bg-[#0F172A]" : "bg-[#0F172A]/80 text-white hover:bg-[#0F172A]"}`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Shop
            </Link>
          </div>
        )}
        <div
          className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${previewSurface}`}
        >
          {preview}
        </div>
        <span className={`text-xs font-bold ${text}`}>{item.label}</span>
      </button>
    );
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";

  if (loading) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${bg}`}>
        <p className={`font-semibold animate-pulse ${textMuted}`}>Loading locker...</p>
      </main>
    );
  }

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className={`flex items-center justify-between px-5 py-4 border-b ${cardBorder}`}>
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-lg font-bold ${text}`}>
          <SparkIcon className="w-5 h-5 inline-block mr-1.5 -mt-0.5" color="#3B82F6" />
          Ink Locker
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <GlobalNotificationBar />
          <Link
            href="/shop"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${light ? "bg-[#DBEAFE] border border-[#3B82F6]/20 hover:bg-[#BFDBFE]" : "bg-[#3B82F6]/20 border border-[#3B82F6]/30 hover:bg-[#3B82F6]/30"}`}
          >
            <InkDropIcon className="w-4 h-4" color="#34D399" />
            <span className="text-sm font-bold" style={{ color: "#34D399" }}>
              {profile?.ink_drops ?? 0}
            </span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 gap-4 sm:gap-6 min-w-0">
        <div className="flex flex-col items-center gap-4 lg:w-1/3 lg:sticky lg:top-6 lg:self-start">
          <div
            className={`relative overflow-hidden rounded-2xl p-8 flex flex-col items-center justify-center w-full max-w-[300px] ${cardBg} border ${cardBorder}`}
          >
            <div
              className={`absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl ${
                light ? "bg-[#DBEAFE]/80" : "bg-[#3B82F6]/25"
              }`}
            />
            <div
              className={`absolute -bottom-16 -right-16 w-44 h-44 rounded-full blur-3xl ${
                light ? "bg-[#D1FAE5]/80" : "bg-[#34D399]/20"
              }`}
            />
            <div
              className={`relative w-[220px] h-[220px] rounded-full border flex items-center justify-center ${
                light
                  ? "bg-white border-[#E2E8F0] shadow-lg"
                  : "bg-[#111827] border-white/20 shadow-lg shadow-black/40"
              }`}
            >
              <InkAvatar config={config} size="xl" />
            </div>
            <p className={`relative mt-4 text-xs font-semibold ${textMuted}`}>
              Cozy corner preview
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`w-full max-w-[280px] py-3.5 rounded-xl font-bold text-base transition-all ${
              hasChanges
                ? "text-white"
                : light ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed" : "bg-white/10 text-white/50 cursor-not-allowed"
            }`}
            style={hasChanges ? { backgroundColor: "#3B82F6" } : {}}
          >
            {saving ? "Saving..." : hasChanges ? "Save Avatar" : "No Changes"}
          </button>
          <p className={`text-xs ${textMuted} text-center max-w-[280px]`}>
            Tip: darker inks get a light contrast ring so they stay readable on every theme.
          </p>
          {/* Auth required — user is always logged in on this page */}
        </div>

        {/* Controls */}
        <div className="flex-1 lg:w-2/3 space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 min-w-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  tab === t.id
                    ? "bg-[#3B82F6] text-white"
                    : light ? "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:border-[#3B82F6] hover:text-[#3B82F6]" : "bg-[#0F172A]/50 text-white/60 border border-white/10 hover:border-[#3B82F6] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={`rounded-xl p-5 ${cardBg} border ${cardBorder}`}>
            {tab === "base" && (
              <div className="space-y-3">
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Shape</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {BASES.map((b) =>
                    renderLockerItem(
                      b,
                      config.base === b.id,
                      () => update({ base: b.id }),
                      <InkAvatar config={{ ...config, base: b.id }} size="sm" />
                    )
                  )}
                </div>
              </div>
            )}

            {tab === "color" && (
              <div className="space-y-3">
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Ink Color</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {COLORS.map((c) =>
                    renderLockerItem(
                      c,
                      config.color === c.hex,
                      () => update({ color: c.hex }),
                      <div
                        className="w-10 h-10 rounded-full shadow-inner"
                        style={{ backgroundColor: c.hex }}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {tab === "eyes" && (
              <div className="space-y-3">
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Expression</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EYES.map((e) =>
                    renderLockerItem(
                      e,
                      config.eyes === e.id,
                      () => update({ eyes: e.id }),
                      <InkAvatar config={{ ...config, eyes: e.id }} size="sm" />
                    )
                  )}
                </div>
              </div>
            )}

            {tab === "accessory" && (() => {
              const slot1 = config.accessory;
              const slot2 = config.accessory2 ?? "none";

              function handleAccessoryClick(id: string) {
                if (activeSlot === 1) {
                  if (id === slot2 && id !== "none") {
                    update({ accessory: id, accessory2: "none" });
                  } else {
                    update({ accessory: id });
                  }
                } else {
                  if (id === slot1 && id !== "none") {
                    update({ accessory: "none", accessory2: id });
                  } else {
                    update({ accessory2: id });
                  }
                }
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Gear</p>
                    <div className="flex gap-1.5">
                      {([1, 2] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setActiveSlot(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeSlot === s
                              ? "bg-[#3B82F6] text-white"
                              : light ? "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]" : "bg-white/10 text-white/60 hover:bg-white/15"
                          }`}
                        >
                          Slot {s}
                          {s === 1 && slot1 !== "none" && <span className="ml-1 opacity-70">•</span>}
                          {s === 2 && slot2 !== "none" && <span className="ml-1 opacity-70">•</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACCESSORIES.map((a) => {
                      const inSlot1 = slot1 === a.id;
                      const inSlot2 = slot2 === a.id;
                      const isSelected = activeSlot === 1 ? inSlot1 : inSlot2;
                      const inOtherSlot = activeSlot === 1 ? inSlot2 : inSlot1;
                      const unlocked = checkUnlocked(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={unlocked ? () => handleAccessoryClick(a.id) : undefined}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            !unlocked
                              ? light ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-50 cursor-not-allowed" : "border-white/10 bg-[#0F172A]/50 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? light ? "border-[#3B82F6] bg-[#DBEAFE] shadow-md" : "border-[#3B82F6] bg-[#3B82F6]/20 shadow-md"
                              : light ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6]/50" : "border-white/10 bg-[#0F172A]/50 hover:border-[#3B82F6]/50"
                          }`}
                        >
                          {!unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <Link
                                href="/shop"
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${light ? "bg-[#0F172A]/90 text-white hover:bg-[#0F172A]" : "bg-[#0F172A]/80 text-white hover:bg-[#0F172A]"}`}
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Shop
                              </Link>
                            </div>
                          )}
                          <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${previewSurface}`}>
                            <InkAvatar config={{ ...config, accessory: a.id, accessory2: "none" }} size="sm" />
                          </div>
                          <span className={`text-xs font-bold ${text}`}>{a.label}</span>
                          {unlocked && a.id !== "none" && (inSlot1 || inSlot2) && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#3B82F6]"
                            }`}>
                              {inSlot1 && inSlot2 ? "Slot 1 & 2" : inSlot1 ? "Slot 1" : "Slot 2"}
                            </span>
                          )}
                          {inOtherSlot && a.id !== "none" && (
                            <span className={`text-[9px] ${textMuted}`}>(other slot)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {tab === "aura" && (() => {
              const ownedVariants = getOwnedAuraVariants(profile?.unlocked_items ?? []);
              const isNoneSelected = config.aura === "none";
              return (
                <div className="space-y-3">
                  <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Aura</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* None option */}
                    <button
                      onClick={() => update({ aura: "none", aura_color: undefined })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isNoneSelected
                          ? light ? "border-[#3B82F6] bg-[#DBEAFE] shadow-md" : "border-[#3B82F6] bg-[#3B82F6]/20 shadow-md"
                          : light ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6]/50" : "border-white/10 bg-[#0F172A]/50 hover:border-[#3B82F6]/50"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${previewSurface}`}>
                        <InkAvatar config={{ ...config, aura: "none", aura_color: undefined }} size="sm" />
                      </div>
                      <span className={`text-xs font-bold ${text}`}>None</span>
                    </button>
                    {/* Owned aura variants */}
                    {ownedVariants.map((v: AuraVariant) => {
                      const isSelected = config.aura === v.auraId && config.aura_color === v.color;
                      return (
                        <button
                          key={v.id}
                          onClick={() => update({ aura: v.auraId, aura_color: v.color })}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? light ? "border-[#3B82F6] bg-[#DBEAFE] shadow-md" : "border-[#3B82F6] bg-[#3B82F6]/20 shadow-md"
                              : light ? "border-[#E2E8F0] bg-white hover:border-[#3B82F6]/50" : "border-white/10 bg-[#0F172A]/50 hover:border-[#3B82F6]/50"
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${previewSurface}`}>
                            <InkAvatar config={{ ...config, aura: v.auraId, aura_color: v.color }} size="sm" />
                          </div>
                          <span className={`text-xs font-bold text-center leading-tight ${text}`}>{v.label}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: RARITY_COLORS[v.rarity], backgroundColor: `${RARITY_COLORS[v.rarity]}20` }}
                          >
                            {RARITY_LABELS[v.rarity]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {ownedVariants.length === 0 && (
                    <p className={`text-xs font-semibold ${textMuted} text-center py-3`}>
                      No auras yet! Open packs in the <Link href="/shop" className="underline" style={{ color: "#3B82F6" }}>Ink Shop</Link> to collect them.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className={`mt-4 pt-4 border-t ${cardBorder}`}>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
                style={{ color: "#3B82F6" }}
              >
                <InkDropIcon className="w-4 h-4" />
                Visit the Ink Shop to unlock more
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all animate-slide-up z-50 ${
            toast.type === "success"
              ? "bg-[#22C55E] text-white"
              : "bg-[#EF4444] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
