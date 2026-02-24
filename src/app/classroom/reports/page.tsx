"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import TeacherLayout, { teacherCardBorder, teacherCardClass } from "@/components/TeacherLayout";
import {
  ClassroomReportListRow,
  getClassroomFeatureFlags,
  getTeacherToken,
  listClassroomReports,
  saveTeacherToken,
  verifyTeacherAccess,
} from "@/lib/supabase/classroom";
import { SURFACE } from "@/lib/design-tokens";

export default function ClassroomReportsPage() {
  return (
    <Suspense fallback={<ReportsLoadingFallback />}>
      <ClassroomReportsPageInner />
    </Suspense>
  );
}

function ReportsLoadingFallback() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 bg-[#0B1220] text-white">
      Loading reports...
    </main>
  );
}

function ClassroomReportsPageInner() {
  const searchParams = useSearchParams();
  const fromTeacher = searchParams.get("from") === "teacher";
  const { light } = useTheme();
  const [rows, setRows] = useState<ClassroomReportListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [subject, setSubject] = useState<"all" | "vocabulary" | "punctuation">("all");
  const [days, setDays] = useState(30);
  const [teacherToken, setTeacherToken] = useState<string | undefined>(undefined);
  const [reportsEnabled, setReportsEnabled] = useState(false);

  useEffect(() => {
    getClassroomFeatureFlags().then((flags) => {
      setReportsEnabled(flags.classroom_reports_v1);
    });
  }, []);

  useEffect(() => {
    const code = roomCode.trim().toUpperCase();
    if (code.length === 6) {
      const existing = getTeacherToken(code);
      if (existing) setTeacherToken(existing);
    }
  }, [roomCode]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await listClassroomReports({
      roomCode: roomCode.trim() || undefined,
      subject,
      days,
      teacherToken,
    });
    if (!res.success) {
      setRows([]);
      setError(res.error ?? "Failed to load reports");
    } else {
      setRows(res.rows);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!reportsEnabled) {
      setLoading(false);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsEnabled]);

  async function unlockRoom() {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6 || teacherCode.trim().length < 4) {
      setError("Enter room code and teacher access code");
      return;
    }
    const res = await verifyTeacherAccess(code, teacherCode.trim());
    if (!res.success || !res.access) {
      setError(res.error ?? "Invalid teacher code");
      return;
    }
    saveTeacherToken(code, res.access.teacherToken);
    setTeacherToken(res.access.teacherToken);
    setTeacherCode("");
    setError(null);
    await refresh();
  }

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const card = fromTeacher ? teacherCardClass(light) : (light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10");
  const cardBorder = fromTeacher ? teacherCardBorder : "rounded-2xl border";

  const canUnlock = useMemo(
    () => roomCode.trim().length === 6 && teacherCode.trim().length >= 4,
    [roomCode, teacherCode]
  );

  const content = (
    <div className="space-y-4">
        {!reportsEnabled && (
          <div className={`${cardBorder} p-4 ${card}`}>
            <p className={`font-semibold ${text}`}>Reports are disabled by feature flag.</p>
            <p className={`text-sm mt-1 ${textMuted}`}>Enable `classroom_reports_v1` in `classroom_feature_flags` to use this page.</p>
          </div>
        )}

        <div className={`${cardBorder} p-4 ${card} grid sm:grid-cols-6 gap-3`}>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={6}
            className={`sm:col-span-2 px-3 py-2 rounded-xl border ${light ? "border-[#E2E8F0]" : "border-white/10 bg-white/5"}`}
          />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as "all" | "vocabulary" | "punctuation")}
            className={`sm:col-span-2 px-3 py-2 rounded-xl border ${light ? "border-[#E2E8F0]" : "border-white/10 bg-white/5"}`}
          >
            <option value="all">All subjects</option>
            <option value="vocabulary">Vocabulary</option>
            <option value="punctuation">Punctuation</option>
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={`sm:col-span-1 px-3 py-2 rounded-xl border ${light ? "border-[#E2E8F0]" : "border-white/10 bg-white/5"}`}
          >
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
          <button
            onClick={refresh}
            className="sm:col-span-1 px-4 py-2 rounded-xl font-bold text-white bg-[#3B82F6]"
          >
            Filter
          </button>

          <input
            value={teacherCode}
            onChange={(e) => setTeacherCode(e.target.value)}
            placeholder="Teacher access code"
            type="password"
            className={`sm:col-span-4 px-3 py-2 rounded-xl border ${light ? "border-[#E2E8F0]" : "border-white/10 bg-white/5"}`}
          />
          <button
            onClick={unlockRoom}
            disabled={!canUnlock}
            className="sm:col-span-2 px-4 py-2 rounded-xl font-bold text-white bg-[#10B981] disabled:opacity-50"
          >
            Unlock Room
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/15 border border-red-500/40 text-red-500 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className={`${cardBorder} ${card} overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${light ? "border-[#E2E8F0]" : "border-white/10"}`}>
            <p className={`font-bold ${text}`}>Recent Sessions</p>
          </div>

          {loading ? (
            <div className={`p-6 ${textMuted}`}>Loading…</div>
          ) : rows.length === 0 ? (
            <div className={`p-6 ${textMuted}`}>No sessions found for this filter.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {rows.map((row) => (
                <Link
                  key={row.session_id}
                  href={`/classroom/reports/${row.session_id}${teacherToken ? `?teacherToken=${encodeURIComponent(teacherToken)}` : ""}${fromTeacher ? (teacherToken ? "&" : "?") + "from=teacher" : ""}`}
                  className={`px-4 py-3 grid sm:grid-cols-6 gap-2 hover:${light ? "bg-[#F8FAFC]" : "bg-white/5"}`}
                >
                  <div className={`sm:col-span-2 ${text}`}>
                    <p className="font-bold">{row.room_code}</p>
                    <p className={`text-xs ${textMuted}`}>{new Date(row.started_at).toLocaleString()}</p>
                  </div>
                  <p className={`sm:col-span-1 ${textMuted}`}>{row.subject}</p>
                  <p className={`sm:col-span-1 ${textMuted}`}>{row.submitted_results}/{row.participants} submitted</p>
                  <p className={`sm:col-span-1 ${textMuted}`}>{row.status}</p>
                  <p className="sm:col-span-1 text-[#3B82F6] font-bold text-sm">Open →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  );

  if (fromTeacher) {
    return (
      <TeacherLayout
        backHref="/teacher/hub"
        backLabel="Teacher Hub"
        navLinks={[
          { href: "/teacher/classroom/create", label: "Create Classroom" },
          { href: "/teacher/classes", label: "Classes" },
        ]}
        title="Classroom Reports"
        subtitle="View session results and export data."
      >
        {content}
      </TeacherLayout>
    );
  }

  return (
    <main className={`min-h-[100dvh] ${bg}`} style={!light ? { background: SURFACE } : undefined}>
      <header className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/play/classroom" className={`text-sm font-bold ${textMuted}`}>Back to Classroom</Link>
        <h1 className={`text-lg font-bold ${text}`}>Classroom Reports</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {content}
      </div>
    </main>
  );
}
