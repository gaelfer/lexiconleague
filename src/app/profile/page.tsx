"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { getProfile, saveProfile, createGuestProfile } from "@/lib/user/storage";
import { syncCurrentProfile, syncProfileForUser } from "@/lib/user/profile-sync";
import { updateUsername, upsertProfile } from "@/lib/supabase/profile";
import { VocabLevel } from "@/types";
import InkAvatar from "@/components/InkAvatar";
import RankBadge from "@/components/RankBadge";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";

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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState(() => getProfile() ?? createGuestProfile());
  const [loading, setLoading] = useState(true);
  const [savingGrade, setSavingGrade] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const p = getProfile() ?? createGuestProfile();
      setProfile(p);
      setUsername(p.username);
      setLoading(false);
      return;
    }
    async function load() {
      const u = user!;
      const synced = await syncProfileForUser(u.id, u.email ?? "");
      setProfile(synced);
      setUsername(synced.username);
      setLoading(false);
    }
    load();
  }, [user, authLoading]);

  const isOAuth = user?.app_metadata?.provider !== "email";
  const canChangePassword = !isOAuth;

  async function handleUsernameSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !username.trim()) return;
    setSavingUsername(true);
    const result = await updateUsername(user.id, username.trim());
    if (result.success) {
      const p = getProfile() ?? profile;
      p.username = username.trim();
      saveProfile(p);
      setProfile({ ...p });
      showToast("success", "Username updated!");
    } else {
      showToast("error", result.error ?? "Failed to update username.");
    }
    setSavingUsername(false);
  }

  async function handleSyncToCloud() {
    if (!user) return;
    setSyncing(true);
    const local = getProfile();
    if (!local) {
      showToast("error", "No local profile to sync.");
      setSyncing(false);
      return;
    }
    try {
      await syncCurrentProfile(user.id);
      showToast("success", `Synced! ${local.trophies} trophies saved to cloud.`);
    } catch {
      showToast("error", "Failed to sync to cloud.");
    }
    setSyncing(false);
  }

  async function handleVocabGradeChange(level: VocabLevel) {
    const next = { ...profile, vocab_grade: level };
    setProfile(next);
    saveProfile(next);
    if (user) {
      setSavingGrade(true);
      await upsertProfile(user.id, next);
      setSavingGrade(false);
      showToast("success", "Vocabulary level saved!");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canChangePassword) return;
    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      showToast("error", error.message);
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password updated!");
    }
    setSavingPassword(false);
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  if (loading) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${bg}`}>
        <p className={`font-semibold animate-pulse ${textMuted}`}>Loading profile...</p>
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
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className={`text-lg font-bold ${text}`}>Profile</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        {!user && (
          <div className={`rounded-xl p-4 ${light ? "bg-[#ECFDF5] border border-[#34D399]/30" : "bg-[#34D399]/10 border border-[#34D399]/20"}`}>
            <p className="text-sm font-bold mb-2" style={{ color: "#059669" }}>Guest mode</p>
            <p className={`text-sm mb-4 ${textMuted}`}>
              Create an account to save your progress, change your username, and climb the leaderboard.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-4 py-2 rounded-lg text-white text-sm font-bold transition-colors"
              style={{ backgroundColor: "#34D399" }}
            >
              Sign up free
            </Link>
          </div>
        )}

        {/* Avatar & basic info */}
        <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
          <div className="flex items-center gap-5">
            <InkAvatar config={profile.avatar_config} size="lg" />
            <div>
              <p className={`${text} font-bold text-lg`}>{profile.username}</p>
              <p className={`${textMuted} text-sm truncate max-w-[200px]`}>{user?.email ?? "—"}</p>
              <RankBadge tier={profile.rank_tier} trophies={profile.trophies} showTrophies size="sm" />
            </div>
          </div>
          <Link
            href="/locker"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: "#3B82F6" }}
          >
            Customize avatar
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Vocabulary level preference */}
        <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
          <h2 className={`${text} font-bold text-base mb-2`}>Vocabulary level</h2>
          <p className={`${textMuted} text-xs mb-4`}>
            Default level for casual vocabulary games (grades 3–8, PSAT, SAT).
          </p>
          <div className="flex flex-wrap gap-2">
            {VOCAB_LEVELS.map(({ value, label }) => (
              <button
                key={String(value)}
                onClick={() => handleVocabGradeChange(value)}
                disabled={savingGrade}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  profile.vocab_grade === value
                    ? "text-white"
                    : light
                      ? "bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1]"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                style={profile.vocab_grade === value ? { backgroundColor: "#3B82F6" } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {user && (
          <>
            <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
              <h2 className={`${text} font-bold text-base mb-2`}>Sync to cloud</h2>
              <p className={`${textMuted} text-xs mb-4`}>
                Push your local progress (trophies, XP, ink drops) to Supabase so it appears on the leaderboard.
              </p>
              <button
                onClick={handleSyncToCloud}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "#22C55E" }}
              >
                {syncing ? "Syncing..." : "Sync now"}
              </button>
            </div>

            <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
              <h2 className={`${text} font-bold text-base mb-2`}>Tutorial</h2>
              <p className={`${textMuted} text-xs mb-4`}>
                Want a refresher? Replay the guided walkthrough from home.
              </p>
              <Link
                href="/?tutorial=1"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#3B82F6" }}
              >
                Replay tutorial
              </Link>
            </div>

            {/* Username change */}
            <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
              <h2 className={`${text} font-bold text-base mb-3`}>Username</h2>
              <p className={`${textMuted} text-xs mb-4`}>
                You can change your username once every 30 days.
              </p>
              <form onSubmit={handleUsernameSave} className="space-y-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  placeholder="Your display name"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium ${light ? "border-[#E2E8F0] focus:border-[#3B82F6] text-[#0F172A]" : "border-white/20 focus:border-[#3B82F6] bg-white/5 text-white"}`}
                />
                <button
                  type="submit"
                  disabled={savingUsername || username.trim() === profile.username}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: "#3B82F6" }}
                >
                  {savingUsername ? "Saving..." : "Save username"}
                </button>
              </form>
            </div>

            {/* Password change (email users only) */}
            {canChangePassword && (
              <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
                <h2 className={`${text} font-bold text-base mb-3`}>Change password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password (optional)"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium ${light ? "border-[#E2E8F0] focus:border-[#3B82F6] text-[#0F172A]" : "border-white/20 focus:border-[#3B82F6] bg-white/5 text-white"}`}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    minLength={8}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium ${light ? "border-[#E2E8F0] focus:border-[#3B82F6] text-[#0F172A]" : "border-white/20 focus:border-[#3B82F6] bg-white/5 text-white"}`}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium ${light ? "border-[#E2E8F0] focus:border-[#3B82F6] text-[#0F172A]" : "border-white/20 focus:border-[#3B82F6] bg-white/5 text-white"}`}
                  />
                  <button
                    type="submit"
                    disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
                    className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: "#3B82F6" }}
                  >
                    {savingPassword ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>
            )}

            {isOAuth && (
              <p className={`${textMuted} text-xs text-center`}>
                Signed in with {user.app_metadata?.provider ?? "OAuth"}. Password changes are not available for social sign-in.
              </p>
            )}
          </>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl z-50 ${
            toast.type === "success" ? "bg-[#22C55E] text-white" : "bg-[#EF4444] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
