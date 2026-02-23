"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import TeacherLayout, { teacherCardBorder, teacherCardClass } from "@/components/TeacherLayout";
import {
  ClassroomReport,
  getClassroomReport,
  getTeacherToken,
  saveTeacherToken,
  verifyTeacherAccess,
} from "@/lib/supabase/classroom";
import { SURFACE } from "@/lib/design-tokens";

export default function ClassroomReportDetailPage() {
  return (
    <Suspense fallback={<ReportDetailLoadingFallback />}>
      <ClassroomReportDetailPageInner />
    </Suspense>
  );
}

function ReportDetailLoadingFallback() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 bg-[#0B1220] text-white">
      Loading report...
    </main>
  );
}

function ClassroomReportDetailPageInner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const fromTeacher = search.get("from") === "teacher";
  const { light } = useTheme();
  const [report, setReport] = useState<ClassroomReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [teacherToken, setTeacherToken] = useState<string | undefined>(search.get("teacherToken") ?? undefined);

  async function load(token?: string) {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    const res = await getClassroomReport(sessionId, token);
    if (!res.success || !res.report) {
      setReport(null);
      setError(res.error ?? "Could not load report");
    } else {
      setReport(res.report);
      setRoomCode(res.report.session.room_code);
      if (!token) {
        const stored = getTeacherToken(res.report.session.room_code);
        if (stored) {
          setTeacherToken(stored);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    void load(teacherToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, teacherToken]);

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
  }

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const card = fromTeacher ? teacherCardClass(light) : (light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10");
  const cardBorder = fromTeacher ? teacherCardBorder : "rounded-2xl border";

  const csvHref = useMemo(() => {
    if (!sessionId) return "#";
    const q = teacherToken ? `?teacherToken=${encodeURIComponent(teacherToken)}` : "";
    return `/api/classroom/reports/${sessionId}/csv${q}`;
  }, [sessionId, teacherToken]);

  const reportsListHref = fromTeacher ? "/classroom/reports?from=teacher" : "/classroom/reports";

  const content = (
    <div className="space-y-4">
        <div className={`${cardBorder} p-4 ${card} grid sm:grid-cols-4 gap-3`}>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={6}
            className={`sm:col-span-1 px-3 py-2 rounded-xl border ${light ? "border-[#E2E8F0]" : "border-white/10 bg-white/5"}`}
          />
          <input
            value={teacherCode}
            onChange={(e) => setTeacherCode(e.target.value)}
            placeholder="Teacher access code"
            type="password"
            className={`sm:col-span-2 px-3 py-2 rounded-xl border ${light ? "border-[#E2E8F0]" : "border-white/10 bg-white/5"}`}
          />
          <button
            onClick={unlockRoom}
            className="sm:col-span-1 px-4 py-2 rounded-xl font-bold text-white bg-[#10B981]"
          >
            Unlock
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/15 border border-red-500/40 text-red-500 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className={`${cardBorder} p-6 ${card} ${textMuted}`}>Loading…</div>
        ) : !report ? (
          <div className={`${cardBorder} p-6 ${card} ${textMuted}`}>No report found.</div>
        ) : (
          <>
            <div className={`${cardBorder} p-4 ${card}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`font-bold ${text}`}>Room {report.session.room_code}</p>
                  <p className={`text-sm ${textMuted}`}>
                    {report.session.subject} · {new Date(report.session.started_at).toLocaleString()} · {report.session.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={csvHref} className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-bold">Export CSV</a>
                  <Link
                    href={`/play/classroom?rerun=${encodeURIComponent(report.session.room_code)}${fromTeacher ? "&host=1" : ""}`}
                    className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-sm font-bold"
                  >
                    Re-run Session
                  </Link>
                </div>
              </div>
            </div>

            <div className={`${cardBorder} ${card} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${light ? "border-[#E2E8F0]" : "border-white/10"}`}>
                <p className={`font-bold ${text}`}>Leaderboard</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${textMuted}`}>
                      <th className="text-left px-4 py-2">#</th>
                      <th className="text-left px-4 py-2">Name</th>
                      <th className="text-left px-4 py-2">Role</th>
                      <th className="text-right px-4 py-2">Score</th>
                      <th className="text-right px-4 py-2">Accuracy</th>
                      <th className="text-left px-4 py-2">Skill Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, idx) => (
                      <tr key={row.participant_id} className={`border-t ${light ? "border-[#E2E8F0]" : "border-white/10"}`}>
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className={`px-4 py-2 font-semibold ${text}`}>{row.display_name}</td>
                        <td className={`px-4 py-2 ${textMuted}`}>{row.role}</td>
                        <td className="px-4 py-2 text-right font-bold" style={{ color: "#3B82F6" }}>{row.score ?? 0}</td>
                        <td className="px-4 py-2 text-right">{row.accuracy ?? 0}%</td>
                        <td className={`px-4 py-2 ${textMuted}`}>
                          {Object.keys(row.skill_breakdown ?? {}).length === 0
                            ? "—"
                            : Object.entries(row.skill_breakdown)
                                .map(([k, v]) => `${k}:${String(v)}`)
                                .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
    </div>
  );

  if (fromTeacher) {
    return (
      <TeacherLayout
        backHref="/teacher"
        backLabel="Teacher Hub"
        navLinks={[
          { href: "/teacher/classroom/create", label: "Create Classroom" },
          { href: "/classroom/reports?from=teacher", label: "Reports" },
          { href: "/teacher/classes", label: "Classes" },
        ]}
        title="Session Report"
        subtitle={report ? `Room ${report.session.room_code} · ${report.session.subject}` : undefined}
      >
        {content}
      </TeacherLayout>
    );
  }

  return (
    <main className={`min-h-[100dvh] ${bg}`} style={!light ? { background: SURFACE } : undefined}>
      <header className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={reportsListHref} className={`text-sm font-bold ${textMuted}`}>Back to Reports</Link>
        <h1 className={`text-lg font-bold ${text}`}>Session Report</h1>
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
