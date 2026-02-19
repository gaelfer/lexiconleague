"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { InkAvatarConfig, DEFAULT_AVATAR_CONFIG, UserProfile } from "@/types";
import { getProfile, saveProfile, isItemUnlocked } from "@/lib/storage";
import { fetchAvatarConfig, updateAvatarConfig } from "@/lib/supabase/avatar";
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
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import SparkIcon from "@/components/icons/SparkIcon";

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
  const [config, setConfig] = useState<InkAvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });
  const [savedConfig, setSavedConfig] = useState<InkAvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("base");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/auth/signup?from=locker";
      return;
    }
    async function load() {
      const p = getProfile();
      setProfile(p);
      const remote = await fetchAvatarConfig(user!.id);
      setConfig(remote);
      setSavedConfig(remote);
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
        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
          !unlocked
            ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-50 cursor-not-allowed"
            : isSelected
            ? "border-[#3B82F6] bg-[#DBEAFE] shadow-md"
            : "border-[#E2E8F0] bg-white hover:border-[#3B82F6]/50"
        }`}
      >
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Link
              href="/shop"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0F172A]/80 text-white text-[10px] font-bold hover:bg-[#0F172A] transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Shop
            </Link>
          </div>
        )}
        {preview}
        <span className="text-xs font-bold text-[#0F172A]">{item.label}</span>
      </button>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#64748B] font-semibold animate-pulse">Loading locker...</p>
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
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className="text-lg font-extrabold text-[#0F172A]">
          <SparkIcon className="w-5 h-5 inline-block mr-1.5 -mt-0.5" color="#3B82F6" />
          Ink Locker
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DBEAFE] border border-[#3B82F6]/20 hover:bg-[#BFDBFE] transition-colors"
          >
            <InkDropIcon className="w-4 h-4" color="#3B82F6" />
            <span className="text-sm font-extrabold text-[#3B82F6]">
              {profile?.ink_drops ?? 0}
            </span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        {/* Preview */}
        <div className="flex flex-col items-center gap-4 lg:w-1/3 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] p-8 flex items-center justify-center w-full max-w-[280px]">
            <InkAvatar config={config} size="xl" />
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`w-full max-w-[280px] py-3.5 rounded-2xl font-extrabold text-base transition-all shadow-lg ${
              hasChanges
                ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white hover:shadow-xl hover:-translate-y-0.5"
                : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none"
            }`}
          >
            {saving ? "Saving..." : hasChanges ? "Save Avatar" : "No Changes"}
          </button>
          {/* Auth required — user is always logged in on this page */}
        </div>

        {/* Controls */}
        <div className="flex-1 lg:w-2/3 space-y-4">
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
            {tab === "base" && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Shape</p>
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
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Ink Color</p>
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
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Expression</p>
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

            {tab === "accessory" && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Accessory</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ACCESSORIES.map((a) =>
                    renderLockerItem(
                      a,
                      config.accessory === a.id,
                      () => update({ accessory: a.id }),
                      <InkAvatar config={{ ...config, accessory: a.id }} size="sm" />
                    )
                  )}
                </div>
              </div>
            )}

            {tab === "aura" && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Aura</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AURAS.map((a) =>
                    renderLockerItem(
                      a,
                      config.aura === a.id,
                      () => update({ aura: a.id }),
                      <InkAvatar config={{ ...config, aura: a.id }} size="sm" />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Link to shop */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
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
