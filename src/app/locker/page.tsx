"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { InkAvatarConfig, DEFAULT_AVATAR_CONFIG, UserProfile } from "@/types";
import { getProfile, saveProfile, isItemUnlocked } from "@/lib/user/storage";
import { fetchAvatarConfig, updateAvatarConfig } from "@/lib/supabase/avatar";
import {
  BASES,
  COLORS,
  EYES,
  ACCESSORIES,
  CosmeticItem,
  ColorItem,
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

function LeafIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function KeyIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5L17 6l2 2 1.5-1.5" />
    </svg>
  );
}

function DropletIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" />
    </svg>
  );
}

function PaletteIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SwordIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
    </svg>
  );
}

const TAB_ICONS: Record<Tab, (light: boolean) => React.ReactNode> = {
  base: (l) => <DropletIcon className="w-3.5 h-3.5" color={l ? "#1D4ED8" : "#3B82F6"} />,
  color: (l) => <PaletteIcon className="w-3.5 h-3.5" color={l ? "#1D4ED8" : "#3B82F6"} />,
  eyes: (l) => <EyeIcon className="w-3.5 h-3.5" color={l ? "#1D4ED8" : "#3B82F6"} />,
  accessory: (l) => <SwordIcon className="w-3.5 h-3.5" color={l ? "#1D4ED8" : "#3B82F6"} />,
  aura: (l) => <SparkIcon className="w-3.5 h-3.5" color={l ? "#1D4ED8" : "#3B82F6"} />,
};

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
      const p = getProfile();
      setProfile(p);
      try {
        const remote = await fetchAvatarConfig(user!.id);
        setConfig(remote);
        setSavedConfig(remote);
      } catch {
        if (p?.avatar_config) {
          setConfig(p.avatar_config);
          setSavedConfig(p.avatar_config);
        }
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
    const p = getProfile();
    if (p) {
      p.avatar_config = config;
      saveProfile(p);
    }
    setSavedConfig(config);
    if (user) {
      const result = await updateAvatarConfig(user.id, config);
      showToast(result.success ? "success" : "error", result.success ? "Avatar saved!" : (result.error ?? "Failed to save."));
    } else {
      showToast("success", "Avatar saved locally!");
    }
    setSaving(false);
  }

  function update(patch: Partial<InkAvatarConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  function checkUnlocked(itemId: string): boolean {
    return isItemUnlocked(itemId, profile);
  }

  // ── Blue palette ────────────────────────────────────────────────────────
  const cardBg = light ? "bg-[#F8FAFC]" : "bg-[#0C1222]";
  const cardBorder = light ? "border-[#3B82F6]/18" : "border-[#1D4ED8]/32";
  const cardShadow = light ? "shadow-lg shadow-blue-100/60" : "shadow-xl shadow-black/70";
  const previewSurface = light ? "bg-[#EFF6FF] border-[#3B82F6]/28" : "bg-[#030712] border-[#1D4ED8]/42";
  const text = light ? "text-[#0F172A]" : "text-[#EFF6FF]";
  const textMuted = light ? "text-[#1D4ED8]" : "text-[#60A5FA]";
  const textFaint = light ? "text-[#1E40AF]/55" : "text-[#1D4ED8]";
  const tabActive = "bg-[#1D4ED8] text-[#EFF6FF] shadow-md shadow-blue-900/30";
  const tabInactive = light
    ? "bg-[#EFF6FF] text-[#1D4ED8] border border-[#3B82F6]/25 hover:bg-[#DBEAFE]/80 hover:border-[#3B82F6]/50"
    : "bg-[#030712] text-[#60A5FA] border border-[#1D4ED8]/30 hover:bg-[#0C1222] hover:text-[#EFF6FF]";
  const selectedCard = light
    ? "border-[#3B82F6] bg-[#EFF6FF] shadow-md shadow-blue-200/40"
    : "border-[#3B82F6] bg-[#3B82F6]/14 shadow-md shadow-blue-900/30";
  const unselectedCard = light
    ? "border-[#3B82F6]/18 bg-[#F8FAFC] hover:border-[#3B82F6]/55"
    : "border-[#1D4ED8]/28 bg-[#030712]/80 hover:border-[#3B82F6]/55";
  const lockedCard = light
    ? "border-[#3B82F6]/12 bg-[#EFF6FF] opacity-50 cursor-not-allowed"
    : "border-[#1D4ED8]/18 bg-[#030712]/50 opacity-50 cursor-not-allowed";

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
          !unlocked ? lockedCard : isSelected ? selectedCard : unselectedCard
        }`}
      >
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Link
              href="/shop"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0C1222]/90 text-[#EFF6FF] hover:bg-[#0C1222] transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Shop
            </Link>
          </div>
        )}
        <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${previewSurface}`}>
          {preview}
        </div>
        <span className={`text-xs font-bold ${text}`}>{item.label}</span>
      </button>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center gap-5 overflow-hidden" style={{ background: "linear-gradient(180deg, #030712 0%, #0C1222 50%, #020617 100%)" }}>
        <style>{`
          @keyframes candle-drift {
            0%, 100% { opacity: 0.2; transform: scale(1) translateY(0); }
            33% { opacity: 0.35; transform: scale(1.04) translateY(-3px); }
            66% { opacity: 0.18; transform: scale(0.97) translateY(2px); }
          }
          .animate-candle { animation: candle-drift 4s ease-in-out infinite; }
        `}</style>
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] pointer-events-none animate-candle" style={{ background: "radial-gradient(ellipse at 15% 100%, rgba(59,130,246,0.22) 0%, rgba(29,78,216,0.08) 50%, transparent 72%)" }} />
        <div className="animate-bounce-soft">
          <InkAvatar config={{ base: "droplet_01", color: "#22C55E", eyes: "eyes_03", accessory: "none", aura: "none" }} size={72} />
        </div>
        <p className="text-[#60A5FA] font-semibold animate-pulse text-sm tracking-wide">Unlocking the wardrobe…</p>
      </main>
    );
  }

  return (
    <main
      className="min-h-[100dvh] flex flex-col overflow-x-hidden"
      style={light
        ? { background: "linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 55%, #F8FAFC 100%)" }
        : { background: "linear-gradient(180deg, #030712 0%, #0C1222 40%, #020617 100%)" }
      }
    >
      {/* ── Custom keyframes ── */}
      <style>{`
        @keyframes candle-drift {
          0%, 100% { opacity: 0.22; transform: scale(1) translateY(0); }
          33% { opacity: 0.38; transform: scale(1.05) translateY(-4px); }
          66% { opacity: 0.16; transform: scale(0.97) translateY(3px); }
        }
        @keyframes warm-drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-6px) rotate(1.5deg); }
          66% { transform: translateY(3px) rotate(-1deg); }
        }
        .animate-candle { animation: candle-drift 4.5s ease-in-out infinite; }
        .animate-candle-2 { animation: candle-drift 6s ease-in-out infinite; animation-delay: 1.5s; }
        .animate-warm-drift { animation: warm-drift 7s ease-in-out infinite; }
        .animate-warm-drift-delay { animation: warm-drift 9s ease-in-out infinite; animation-delay: 2s; }
      `}</style>

      {/* ── Fixed cabin background scene ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Candlelight glow — bottom left, soft warm gold */}
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[480px] animate-candle"
          style={{
            background: light
              ? "radial-gradient(ellipse at 15% 100%, rgba(59,130,246,0.2) 0%, rgba(29,78,216,0.08) 45%, transparent 72%)"
              : "radial-gradient(ellipse at 15% 100%, rgba(59,130,246,0.28) 0%, rgba(29,78,216,0.1) 48%, transparent 72%)",
          }}
        />
        {/* Secondary moss-green ambient — right side */}
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[360px] animate-candle-2"
          style={{
            background: light
              ? "radial-gradient(ellipse at 85% 100%, rgba(59,130,246,0.12) 0%, transparent 65%)"
              : "radial-gradient(ellipse at 85% 100%, rgba(29,78,216,0.14) 0%, transparent 65%)",
          }}
        />
        {/* Moonlight window — top right */}
        <div
          className="absolute top-0 right-20 w-32 h-60"
          style={{
            background: light
              ? "linear-gradient(180deg, rgba(59,130,246,0.12) 0%, transparent 100%)"
              : "linear-gradient(180deg, rgba(29,78,216,0.06) 0%, transparent 100%)",
          }}
        />
        {/* Warm ceiling wash */}
        <div
          className="absolute top-0 left-0 right-0 h-20"
          style={{
            background: light
              ? "linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 100%)"
              : "linear-gradient(180deg, rgba(29,78,216,0.06) 0%, transparent 100%)",
          }}
        />
        {/* Wooden beam lines — dark forest timber */}
        <div className="absolute top-[68px] left-0 right-0 h-[2px]" style={{ background: light ? "rgba(29,78,216,0.1)" : "rgba(30,58,138,0.45)" }} />
        <div className="absolute top-[70px] left-0 right-0 h-[1px]" style={{ background: light ? "rgba(29,78,216,0.05)" : "rgba(30,58,138,0.25)" }} />
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: light ? "rgba(29,78,216,0.1)" : "rgba(15,23,42,0.55)" }} />
        {/* Ambient background inklings — barely visible tavern patrons */}
        <div className="absolute bottom-12 right-6 opacity-[0.05] pointer-events-none" style={{ transform: "rotate(-10deg)" }}>
          <InkAvatar config={{ base: "droplet_01", color: "#22C55E", eyes: "eyes_01", accessory: "none", aura: "none" }} size={88} />
        </div>
        <div className="absolute top-1/3 left-3 opacity-[0.04] pointer-events-none" style={{ transform: "rotate(18deg)" }}>
          <InkAvatar config={{ base: "droplet_02", color: "#8B5CF6", eyes: "eyes_01", accessory: "none", aura: "none" }} size={72} />
        </div>
        <div className="absolute top-1/4 right-1/3 opacity-[0.03] pointer-events-none" style={{ transform: "rotate(-5deg)" }}>
          <InkAvatar config={{ base: "droplet_03", color: "#3B82F6", eyes: "eyes_01", accessory: "none", aura: "none" }} size={56} />
        </div>
      </div>

      {/* ── Header ── */}
      <header
        className={`relative z-20 flex items-center justify-between px-5 py-3.5 border-b`}
        style={{
          borderColor: light ? "rgba(59,130,246,0.18)" : "rgba(29,78,216,0.35)",
          background: light
            ? "rgba(248,250,252,0.88)"
            : "rgba(12,18,34,0.88)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/dashboard"
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} hover:text-[#3B82F6]`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-base font-bold flex items-center gap-2 ${text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
          <LeafIcon className="w-4 h-4" color="#3B82F6" />
          Ink Locker
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <GlobalNotificationBar />
          <Link
            href="/shop"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors border"
            style={light
              ? { background: "rgba(239,246,255,0.9)", borderColor: "rgba(59,130,246,0.28)" }
              : { background: "rgba(12,18,34,0.9)", borderColor: "rgba(29,78,216,0.42)" }
            }
          >
            <InkDropIcon className="w-4 h-4" color="#34D399" />
            <span className="text-sm font-bold" style={{ color: "#34D399" }}>
              {profile?.ink_drops ?? 0}
            </span>
          </Link>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-8 gap-6 sm:gap-8 min-w-0 relative z-10">

        {/* ── Left: Preview stage ── */}
        <div className="flex flex-col items-center gap-4 lg:w-[300px] shrink-0 lg:sticky lg:top-6 lg:self-start">

          {/* Stage title */}
          <div className="flex items-center gap-2 self-start w-full max-w-[300px]">
            <div className="h-px flex-1" style={{ background: light ? "rgba(90,138,56,0.18)" : "rgba(74,112,48,0.32)" }} />
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${textFaint}`}>Your Inkling</span>
            <div className="h-px flex-1" style={{ background: light ? "rgba(90,138,56,0.18)" : "rgba(74,112,48,0.32)" }} />
          </div>

          {/* Preview card with companion inklings */}
          <div className="relative w-full max-w-[300px]">
            {/* Ember — bouncing left companion */}
            <div className="absolute -left-7 bottom-[88px] z-20 pointer-events-none" style={{ transform: "rotate(-10deg)" }}>
              <div className="animate-bounce-soft">
                <InkAvatar config={{ base: "droplet_02", color: "#F97316", eyes: "eyes_01", accessory: "scarf_01", aura: "none" }} size={56} />
              </div>
            </div>

            {/* Scholar — drifting right companion */}
            <div className="absolute -right-5 bottom-[96px] z-20 pointer-events-none" style={{ transform: "rotate(8deg)" }}>
              <div className="animate-warm-drift">
                <InkAvatar config={{ base: "droplet_01", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01", aura: "none" }} size={52} />
              </div>
            </div>

            {/* Preview card */}
            <div
              className={`relative overflow-hidden flex flex-col items-center justify-center w-full border ${cardShadow}`}
              style={{
                borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem",
                borderColor: light ? "rgba(59,130,246,0.22)" : "rgba(29,78,216,0.5)",
                background: light
                  ? "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 50%, #F8FAFC 100%)"
                  : "linear-gradient(160deg, #0C1222 0%, #030712 50%, #0C1222 100%)",
                padding: "2rem 1.5rem 1.25rem",
              }}
            >
              {/* Candlelight glow blobs — soft gold, not orange */}
              <div
                className="absolute -bottom-14 -left-14 w-44 h-44 rounded-full blur-3xl animate-candle"
                style={{ background: light ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.18)" }}
              />
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl animate-warm-drift-delay"
                style={{ background: light ? "rgba(134,195,84,0.14)" : "rgba(100,170,60,0.12)" }}
              />

              {/* Avatar on the mossy stage */}
              <div className="relative mb-3">
                {/* Soft candle halo — golden, very gentle */}
                <div
                  className="absolute inset-0 rounded-full animate-candle"
                  style={{
                    background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
                    transform: "scale(1.5)",
                  }}
                />
                <div
                  className={`relative w-[200px] h-[200px] rounded-full border flex items-center justify-center ${previewSurface}`}
                  style={{
                    boxShadow: light
                      ? "0 4px 32px rgba(59,130,246,0.18), 0 0 0 3px rgba(59,130,246,0.1), inset 0 0 24px rgba(59,130,246,0.06)"
                      : "0 4px 40px rgba(29,78,216,0.4), 0 0 0 3px rgba(29,78,216,0.28), inset 0 0 32px rgba(59,130,246,0.04)",
                  }}
                >
                  <InkAvatar config={config} size="xl" />
                </div>
              </div>

              {/* Floor crew — sitting below the avatar */}
              <div className="relative flex items-end justify-center gap-5 mb-2">
                <div style={{ transform: "rotate(-18deg)", marginBottom: "-4px" }} className="opacity-70">
                  <InkAvatar config={{ base: "droplet_04", color: "#06B6D4", eyes: "eyes_08", accessory: "none", aura: "none" }} size={34} />
                </div>
                <div style={{ transform: "rotate(6deg)" }} className="opacity-75">
                  <InkAvatar config={{ base: "droplet_01", color: "#22C55E", eyes: "eyes_03", accessory: "none", aura: "none" }} size={30} />
                </div>
                <div style={{ transform: "rotate(-5deg)", marginBottom: "-2px" }} className="opacity-60">
                  <InkAvatar config={{ base: "droplet_02", color: "#EC4899", eyes: "eyes_06", accessory: "none", aura: "none" }} size={28} />
                </div>
              </div>

              <p className={`relative text-[10px] font-semibold tracking-wider uppercase ${textFaint}`}>Preview · Ink Locker</p>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="relative w-full max-w-[280px] py-3.5 rounded-xl font-bold text-base transition-all overflow-hidden"
            style={
              hasChanges
                ? {
                    background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                    color: "#EFF6FF",
                    boxShadow: "0 4px 20px rgba(29,78,216,0.45)",
                  }
                : light
                ? { background: "#DBEAFE", color: "#1D4ED8" }
                : { background: "#0C1222", color: "#60A5FA" }
            }
          >
            {saving ? "Saving…" : hasChanges ? "✦ Save Avatar" : "No Changes"}
          </button>

          <p className={`text-xs ${textMuted} text-center max-w-[260px] leading-relaxed`}>
            Darker inks get a contrast ring so they stay sharp on every theme.
          </p>
        </div>

        {/* ── Right: The Wardrobe ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Shelf scene + wardrobe header */}
          <div>
            {/* Inklings on the shelf */}
            <div className="relative mb-0.5">
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
            style={{
              background: light
                ? "linear-gradient(90deg, transparent, rgba(29,78,216,0.28) 20%, rgba(29,78,216,0.28) 80%, transparent)"
                : "linear-gradient(90deg, transparent, rgba(30,58,138,0.65) 20%, rgba(30,58,138,0.65) 80%, transparent)",
              boxShadow: light ? "0 1px 4px rgba(29,78,216,0.08)" : "0 2px 8px rgba(0,0,0,0.5)",
            }}
              />
              <div
                className="absolute bottom-[-3px] left-0 right-0 h-[2px] rounded-full opacity-40"
                style={{ background: light ? "rgba(29,78,216,0.12)" : "rgba(0,0,0,0.5)" }}
              />
              <div className="flex items-end justify-end gap-1.5 pb-0.5 pr-6">
                {/* Sunny — yellow winking */}
                <div style={{ transform: "rotate(-6deg)" }}>
                  <div className="animate-bounce-soft" style={{ animationDelay: "0.4s" }}>
                    <InkAvatar config={{ base: "droplet_03", color: "#EAB308", eyes: "eyes_06", accessory: "bow_01", aura: "none" }} size={36} />
                  </div>
                </div>
                {/* Sage — green glasses */}
                <div style={{ transform: "rotate(4deg)" }}>
                  <div className="animate-warm-drift" style={{ animationDelay: "1.2s" }}>
                    <InkAvatar config={{ base: "droplet_01", color: "#22C55E", eyes: "eyes_03", accessory: "glasses_01", aura: "none" }} size={40} />
                  </div>
                </div>
                {/* Snooze — napping */}
                <div style={{ transform: "rotate(-30deg)", marginBottom: "2px" }} className="opacity-75">
                  <InkAvatar config={{ base: "droplet_04", color: "#F97316", eyes: "eyes_08", accessory: "none", aura: "none" }} size={32} />
                </div>
                {/* Blue monocle — peeking */}
                <div style={{ transform: "rotate(10deg)" }} className="opacity-80">
                  <InkAvatar config={{ base: "droplet_02", color: "#3B82F6", eyes: "eyes_04", accessory: "monocle_01", aura: "none" }} size={34} />
                </div>
              </div>
            </div>

            {/* Wardrobe title row */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: light ? "rgba(29,78,216,0.1)" : "rgba(29,78,216,0.25)" }}
                >
                  <KeyIcon className="w-4 h-4" color="#3B82F6" />
                </div>
                <h2 className={`font-bold text-xl ${text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  The Wardrobe
                </h2>
              </div>
              <Link
                href="/shop"
                className={`text-xs font-bold transition-colors flex items-center gap-1 ${textMuted} hover:text-[#3B82F6]`}
              >
                <InkDropIcon className="w-3.5 h-3.5" color="#3B82F6" />
                Ink Shop →
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 min-w-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  tab === t.id ? tabActive : tabInactive
                }`}
              >
                {TAB_ICONS[t.id](light)}
                {t.label}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div
            className={`rounded-2xl p-5 border ${cardShadow}`}
            style={{
              borderColor: light ? "rgba(59,130,246,0.18)" : "rgba(29,78,216,0.38)",
              background: light
                ? "linear-gradient(160deg, #FAFDF7 0%, #F5FAF2 100%)"
                : "linear-gradient(160deg, #111808 0%, #0E1606 100%)",
            }}
          >
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
                      <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: c.hex }} />
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
                              ? "bg-[#1D4ED8] text-[#EFF6FF]"
                              : light
                              ? "bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]/80"
                              : "bg-[#030712] text-[#60A5FA] hover:bg-[#0C1222]"
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
                            !unlocked ? lockedCard : isSelected ? selectedCard : unselectedCard
                          }`}
                        >
                          {!unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <Link
                                href="/shop"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0C1222]/90 text-[#EFF6FF] hover:bg-[#0C1222] transition-colors"
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
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6]">
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
                    <button
                      onClick={() => update({ aura: "none", aura_color: undefined })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isNoneSelected ? selectedCard : unselectedCard
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner ${previewSurface}`}>
                        <InkAvatar config={{ ...config, aura: "none", aura_color: undefined }} size="sm" />
                      </div>
                      <span className={`text-xs font-bold ${text}`}>None</span>
                    </button>
                    {ownedVariants.map((v: AuraVariant) => {
                      const isSelected = config.aura === v.auraId && config.aura_color === v.color;
                      return (
                        <button
                          key={v.id}
                          onClick={() => update({ aura: v.auraId, aura_color: v.color })}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected ? selectedCard : unselectedCard
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
                    <div className="text-center py-6">
                      <div className="animate-warm-drift inline-block mb-3">
                        <InkAvatar config={{ base: "droplet_03", color: "#22C55E", eyes: "eyes_05", accessory: "none", aura: "none" }} size={48} />
                      </div>
                      <p className={`text-xs font-semibold ${textMuted}`}>
                        No auras yet! Open packs in the{" "}
                        <Link href="/shop" className="underline" style={{ color: "#3B82F6" }}>
                          Ink Shop
                        </Link>{" "}
                        to collect them.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Footer */}
            <div
              className="mt-5 pt-4 border-t"
              style={{ borderColor: light ? "rgba(59,130,246,0.15)" : "rgba(29,78,216,0.28)" }}
            >
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-80"
                style={{ color: "#3B82F6" }}
              >
                <InkDropIcon className="w-4 h-4" color="#3B82F6" />
                Visit the Ink Shop to unlock more
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all animate-slide-up z-50 ${
            toast.type === "success" ? "bg-[#22C55E] text-white" : "bg-[#EF4444] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
