"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import TeacherLayout, { teacherCardBorder, teacherCardClass } from "@/components/TeacherLayout";
import { useTheme } from "@/context/ThemeContext";
import { useTeacherPortalAccess } from "@/lib/teacher/useTeacherPortalAccess";
import {
  createClassroomRoom,
  getClassroomFeatureFlags,
  saveTeacherToken,
  verifyTeacherAccess,
} from "@/lib/supabase/classroom";

const AMBER = "#F59E0B";
const AMBER_DARK = "#D97706";
const GOLD = "#FBBF24";
const CLASSROOM_CODE_LEN = 6;
const MAX_CLASSROOM_PLAYERS = 30;

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateClassroomCode(): string {
  let code = "";
  for (let i = 0; i < CLASSROOM_CODE_LEN; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export default function TeacherClassroomCreatePage() {
  const router = useRouter();
  const { light } = useTheme();
  const { checking, isAuthenticated, portalEnabled, status } = useTeacherPortalAccess();
  const [featureFlags, setFeatureFlags] = useState({ classroom_access_code_v1: false });
  const [accessCode, setAccessCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getClassroomFeatureFlags().then(setFeatureFlags);
  }, []);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.replace("/auth/login?next=/teacher/classroom/create");
    }
  }, [checking, isAuthenticated, router]);

  useEffect(() => {
    if (!checking || !portalEnabled || !status?.teacher_approved) return;
    if (status && !status.teacher_onboarding_completed) {
      router.replace("/teacher/onboarding");
    }
  }, [checking, portalEnabled, status, router]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCreating(true);

    const code = generateClassroomCode();

    if (featureFlags.classroom_access_code_v1) {
      const teacherCode = accessCode.trim();
      if (teacherCode.length < 4) {
        setError("Access code must be at least 4 characters.");
        setCreating(false);
        return;
      }

      const created = await createClassroomRoom(code, teacherCode, MAX_CLASSROOM_PLAYERS);
      if (!created.success) {
        setError(created.error ?? "Could not create classroom room");
        setCreating(false);
        return;
      }

      const verified = await verifyTeacherAccess(code, teacherCode);
      if (!verified.success || !verified.access) {
        setError(verified.error ?? "Could not verify teacher access");
        setCreating(false);
        return;
      }

      saveTeacherToken(code, verified.access.teacherToken);
    }

    setCreating(false);
    router.push(`/play/classroom?code=${code}&host=1`);
  }

  if (checking || !portalEnabled || !status?.teacher_approved) {
    return (
      <TeacherLayout>
        <div className="animate-pulse text-amber-500 font-semibold">Loading…</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      backHref="/teacher/hub"
      backLabel="Teacher Hub"
      navLinks={[{ href: "/classroom/reports?from=teacher", label: "Reports" }]}
      title="Create Classroom"
      subtitle="Generate a game PIN and host a Battle Royale session for your students."
    >
      <div className={`${teacherCardBorder} p-8 ${teacherCardClass(light)}`}>
        <form onSubmit={handleCreate} className="space-y-6">
          {featureFlags.classroom_access_code_v1 && (
            <div>
              <label className="block text-sm font-bold text-[#0F172A] dark:text-white mb-2">
                Teacher access code
              </label>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">
                Students will need the game PIN to join. This code secures your room for reports and session management.
              </p>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Min 4 characters"
                minLength={4}
                className="w-full rounded-xl border-2 border-amber-200/50 dark:border-amber-500/30 px-4 py-3 text-sm font-medium bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl px-6 py-4 text-base font-bold text-slate-900 disabled:opacity-60 transition-all hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`,
              boxShadow: `0 4px 20px ${AMBER}40`,
            }}
          >
            {creating ? "Creating…" : "Create Classroom"}
          </button>
        </form>

        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-6">
          You&apos;ll be taken to the lobby where you can configure vocabulary level, lock the room, and start the round when students have joined.
        </p>
      </div>
    </TeacherLayout>
  );
}
