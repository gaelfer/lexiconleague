"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import TeacherPortalLoader from "@/components/TeacherPortalLoader";
import {
  ClassroomReportListRow,
  listTeacherClasses,
  listTeacherRecentSessions,
} from "@/lib/supabase/teacher-portal";
import { useTeacherPortalAccess } from "@/lib/teacher/useTeacherPortalAccess";
import { TeacherClass } from "@/types";
import TeacherLandingPage from "./TeacherLandingPage";

const AMBER = "#F59E0B";
const AMBER_DARK = "#D97706";
const GOLD = "#FBBF24";

export default function TeacherPortalHomeInner({ teacherMode }: { teacherMode: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const { light } = useTheme();
  const { checking, isAuthenticated, portalEnabled, status, error } = useTeacherPortalAccess();

  const [loadingData, setLoadingData] = useState(true);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [sessions, setSessions] = useState<ClassroomReportListRow[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Not in teacher mode (logged in as student): show landing page, don't auto-switch to teacher
  if (!teacherMode) {
    return <TeacherLandingPage light={light} />;
  }

  // Redirect to onboarding if not completed (teachers log in via teacher-login, then complete setup)
  useEffect(() => {
    if (checking || !isAuthenticated || !portalEnabled || error) return;
    if (status && !status.teacher_onboarding_completed) {
      router.replace("/teacher/onboarding");
    }
  }, [checking, isAuthenticated, portalEnabled, error, status?.teacher_onboarding_completed, router]);

  useEffect(() => {
    let cancelled = false;
    if (checking || !status?.teacher_approved || !portalEnabled) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    Promise.all([listTeacherClasses(), listTeacherRecentSessions(8)]).then(([classRes, sessionsRes]) => {
      if (cancelled) return;
      if (!classRes.success) {
        setDataError(classRes.error ?? "Could not load classes");
      } else if (!sessionsRes.success) {
        setDataError(sessionsRes.error ?? "Could not load sessions");
      } else {
        setClasses(classRes.rows.filter((row) => !row.archived));
        setSessions(sessionsRes.rows);
        setDataError(null);
      }
      setLoadingData(false);
    });

    return () => {
      cancelled = true;
    };
  }, [checking, status?.teacher_approved, portalEnabled]);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions.filter((s) => new Date(s.started_at).getTime() >= start.getTime());
  }, [sessions]);

  const card = light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";

  if (checking) {
    return <TeacherPortalLoader />;
  }

  // Unauthenticated: show landing page with curriculum, tools, then login CTAs
  if (!isAuthenticated) {
    return <TeacherLandingPage light={light} />;
  }

  if (!portalEnabled) {
    return (
      <main className={`min-h-screen px-6 py-10 ${light ? "bg-[#F8FAFC]" : "bg-[#0B1220]"}`}>
        <div className={`max-w-2xl mx-auto rounded-2xl border p-6 ${card}`}>
          <h1 className={`text-2xl font-extrabold ${text}`}>Teacher Portal Unavailable</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>The `teacher_portal_v1` feature flag is currently off.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`min-h-screen px-6 py-10 ${light ? "bg-[#F8FAFC]" : "bg-[#0B1220]"}`}>
        <div className={`max-w-2xl mx-auto rounded-2xl border p-6 ${card}`}>
          <h1 className={`text-2xl font-extrabold ${text}`}>Teacher Portal</h1>
          <p className="text-sm mt-2 text-red-500">{error}</p>
        </div>
      </main>
    );
  }

  const pending = status?.account_type === "teacher" && !status.teacher_approved;

  if (pending) {
    return (
      <main className={`min-h-screen px-6 py-10 ${light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]"}`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors flex items-center gap-1.5`}>
              <span aria-hidden>←</span> Home
            </Link>
            <ThemeToggle />
          </div>

          <div className={`rounded-2xl border-2 p-6 ${light ? "bg-white border-amber-200/50 shadow-xl shadow-amber-500/5" : "bg-[#131922] border-amber-500/20"}`}>
            <h1 className={`text-2xl font-extrabold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Verification Pending</h1>
            <p className={`text-sm mt-2 ${textMuted}`}>
              Your teacher account is pending review. Most requests are reviewed within 24-48 hours.
            </p>
            {status.verification_reason && <p className={`text-sm mt-3 ${textMuted}`}>Status detail: {status.verification_reason}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-900" style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)` }}>
                Back to Home
              </Link>
              <Link href="/teacher/classroom/create" className={`rounded-xl px-4 py-2 text-sm font-semibold border-2 ${light ? "border-amber-300 text-amber-700" : "border-amber-500/40 text-amber-400"}`}>
                Create classroom
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (status?.account_type !== "teacher") {
    return (
      <main className={`min-h-screen px-6 py-10 ${light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]"}`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors flex items-center gap-1.5`}>
              <span aria-hidden>←</span> Home
            </Link>
            <ThemeToggle />
          </div>

          <div className={`rounded-2xl border-2 p-6 ${light ? "bg-white border-amber-200/50 shadow-xl shadow-amber-500/5" : "bg-[#131922] border-amber-500/20"}`}>
            <h1 className={`text-2xl font-extrabold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Teacher Portal</h1>
            <p className={`text-sm mt-2 ${textMuted}`}>
              Complete the teacher setup to access classes, rosters, and reports.
            </p>
            <Link href="/teacher/onboarding" className="inline-block mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-900" style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)` }}>
              Complete teacher setup
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const bg = light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]";
  const cardHud = light ? "bg-white border-amber-200/50 shadow-xl shadow-amber-500/5" : "bg-[#131922] border-amber-500/20";

  return (
    <main className={`min-h-screen px-6 py-10 ${bg} relative overflow-hidden`}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${light ? "#0F172A" : "#fff"} 1px, transparent 1px),
              linear-gradient(90deg, ${light ? "#0F172A" : "#fff"} 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${light ? "bg-amber-200/30" : "bg-amber-500/10"}`} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header HUD */}
        <div className="flex items-center justify-between mb-8 gap-3">
          <Link href="/" className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors flex items-center gap-1.5`}>
            <span aria-hidden>←</span> Home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}40` }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Teacher Portal
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className={`text-3xl sm:text-4xl font-extrabold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Classroom Hub
          </h1>
          <p className={`text-sm mt-1 ${textMuted}`}>Operations center for today&apos;s sessions.</p>
        </div>

        {search.get("pending") === "1" && (
          <div className="mb-6 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
            Verification submitted. You now have teacher account access once approval completes.
          </div>
        )}

        {/* Stats HUD */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Today", value: today.length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Active Classes", value: classes.length, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            { label: "Sessions (30d)", value: sessions.length, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border-2 p-5 ${cardHud} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>{stat.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${text}`}>{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${AMBER}20` }}>
                  <svg className="w-6 h-6" style={{ color: AMBER }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Quick Actions HUD */}
        <section className={`rounded-2xl border-2 p-6 mb-6 ${cardHud}`}>
          <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {[
              { href: "/teacher/classroom/create", label: "Create Classroom", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", accent: "#0EA5E9" },
              { href: "/classroom/reports?from=teacher", label: "Open Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", accent: "#2563EB" },
              { href: "/teacher/classes", label: "Classes & Rosters", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", accent: "#0F766E" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: action.accent, boxShadow: `0 4px 14px ${action.accent}40` }}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Sessions HUD */}
        <section className={`rounded-2xl border-2 p-6 ${cardHud}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Recent Sessions</h2>
            <Link href="/classroom/reports?from=teacher" className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors`}>
              View all reports
            </Link>
          </div>
          {loadingData && <p className={`text-sm mt-4 ${textMuted}`}>Loading sessions...</p>}
          {dataError && <p className="text-sm mt-4 text-red-500">{dataError}</p>}
          {!loadingData && !dataError && sessions.length === 0 && (
            <p className={`text-sm mt-4 ${textMuted}`}>No classroom sessions yet.</p>
          )}
          {!loadingData && !dataError && sessions.length > 0 && (
            <div className="mt-4 divide-y divide-black/10 dark:divide-white/10">
              {sessions.map((session) => (
                <Link
                  key={session.session_id}
                  href={`/classroom/reports/${session.session_id}?from=teacher`}
                  className="flex items-center justify-between gap-3 py-3 hover:opacity-85 transition-opacity"
                >
                  <div>
                    <p className={`text-sm font-semibold ${text}`}>{session.room_code} · {session.subject}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {new Date(session.started_at).toLocaleString()} · {session.participants} participants
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${light ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                    {session.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

