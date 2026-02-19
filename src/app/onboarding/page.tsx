"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, saveProfile, createGuestProfile } from "@/lib/user/storage";
import { syncProfileForUser } from "@/lib/user/profile-sync";
import { upsertProfile } from "@/lib/supabase/profile";
import { VocabLevel } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";

const VOCAB_LEVELS: { value: VocabLevel; label: string }[] = [
  { value: 3, label: "Grade 3" },
  { value: 4, label: "Grade 4" },
  { value: 5, label: "Grade 5" },
  { value: 6, label: "Grade 6" },
  { value: 7, label: "Grade 7" },
  { value: 8, label: "Grade 8" },
  { value: "psat", label: "PSAT" },
  { value: "sat", label: "SAT" },
];

const BLUE = "#3B82F6";
const MINT = "#34D399";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-white/60">Loading…</div></div>}>
      <OnboardingPageInner />
    </Suspense>
  );
}

function OnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/";
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const [username, setUsername] = useState("");
  const [vocabGrade, setVocabGrade] = useState<VocabLevel | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    async function load() {
      const synced = await syncProfileForUser(user!.id, user!.email ?? "");
      if (synced.onboarding_completed) {
        router.replace(nextUrl);
        return;
      }
      setUsername(synced.username && synced.username !== "Challenger" ? synced.username : "");
      setVocabGrade(synced.vocab_grade ?? "");
      setLoading(false);
    }
    load();
  }, [user, authLoading, router, nextUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const u = username.trim();
    if (!u || u.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    if (u.length > 20) {
      setError("Username must be 20 characters or less.");
      return;
    }
    setError("");
    setSaving(true);
    const profile = getProfile() ?? createGuestProfile();
    const updated = {
      ...profile,
      id: user.id,
      email: user.email ?? "",
      username: u,
      vocab_grade: vocabGrade || undefined,
      onboarding_completed: true,
    };
    saveProfile(updated);
    const result = await upsertProfile(user.id, updated);
    if (result.success) {
      router.replace(nextUrl);
    } else {
      setError(result.error ?? "Failed to save. Try again.");
      setSaving(false);
    }
  }

  const bg = light ? "bg-white" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const inputBg = light ? "bg-white border-[#E2E8F0]" : "bg-white/5 border-white/20 text-white";

  if (authLoading || loading) {
    return (
      <main className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className={`${textMuted} font-medium`}>Loading…</div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${bg} flex flex-col items-center justify-center px-6 py-12`}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-extrabold ${text} mb-1`}>Welcome to Lexicon League!</h1>
          <p className={`text-sm ${textMuted}`}>Choose your username and default vocabulary level.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-sm font-bold ${text} mb-2`}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. WordNinja99"
              maxLength={20}
              className={`w-full px-4 py-3 rounded-2xl border-2 ${inputBg} focus:border-[#3B82F6] focus:outline-none placeholder-[#64748B] text-sm font-medium`}
              autoFocus
            />
            <p className={`text-xs ${textMuted} mt-1`}>2–20 characters. You can change this later in Profile.</p>
          </div>

          <div>
            <label className={`block text-sm font-bold ${text} mb-2`}>Default vocabulary level</label>
            <p className={`text-xs ${textMuted} mb-2`}>Used for casual mode. You can change this anytime.</p>
            <div className="grid grid-cols-2 gap-2">
              {VOCAB_LEVELS.map(({ value, label }) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setVocabGrade(value)}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    vocabGrade === value
                      ? "border-[#3B82F6] text-white"
                      : light
                        ? "border-[#E2E8F0] text-[#0F172A] hover:border-[#3B82F6]/50"
                        : "border-white/20 text-white hover:border-white/40"
                  }`}
                  style={vocabGrade === value ? { backgroundColor: BLUE } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !username.trim()}
            className="w-full py-3.5 rounded-2xl font-extrabold text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: BLUE }}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </form>

        <p className={`mt-6 text-center text-xs ${textMuted}`}>
          Your username will be visible to friends and on the leaderboard.
        </p>
      </div>
    </main>
  );
}
