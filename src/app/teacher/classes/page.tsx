"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import TeacherLayout, { teacherCardBorder, teacherCardClass } from "@/components/TeacherLayout";
import { useTheme } from "@/context/ThemeContext";
import {
  createTeacherClass,
  listTeacherClasses,
} from "@/lib/supabase/teacher-portal";
import { useTeacherPortalAccess } from "@/lib/teacher/useTeacherPortalAccess";
import { TeacherClass } from "@/types";

export default function TeacherClassesPage() {
  const router = useRouter();
  const { light } = useTheme();
  const { checking, isAuthenticated, portalEnabled, status } = useTeacherPortalAccess();

  const [rows, setRows] = useState<TeacherClass[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [gradeLabel, setGradeLabel] = useState("");
  const [subject, setSubject] = useState("");
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoadingRows(true);
    const result = await listTeacherClasses();
    if (!result.success) {
      setError(result.error ?? "Could not load classes");
      setRows([]);
    } else {
      setError(null);
      setRows(result.rows);
    }
    setLoadingRows(false);
  }

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.replace("/auth/login?next=/teacher/classes");
    }
  }, [checking, isAuthenticated, router]);

  useEffect(() => {
    if (checking || !portalEnabled || !status?.teacher_approved) {
      setLoadingRows(false);
      return;
    }
    void reload();
  }, [checking, portalEnabled, status?.teacher_approved]);

  async function onCreateClass(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Class name is required");
      return;
    }
    setCreating(true);
    const result = await createTeacherClass({
      name: name.trim(),
      gradeLabel: gradeLabel.trim() || undefined,
      subject: subject.trim() || undefined,
    });
    setCreating(false);

    if (!result.success) {
      setError(result.error ?? "Could not create class");
      return;
    }

    setName("");
    setGradeLabel("");
    setSubject("");
    await reload();
  }

  const card = light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const input = light
    ? "bg-white border-[#CBD5E1] text-[#0F172A] placeholder-[#64748B]"
    : "bg-[#0F172A] border-white/10 text-white placeholder-[#94A3B8]";

  if (!portalEnabled) {
    return (
      <TeacherLayout>
        <p className={text}>Teacher portal is disabled.</p>
      </TeacherLayout>
    );
  }

  if (!status?.teacher_approved) {
    return (
      <TeacherLayout backHref="/teacher" backLabel="Teacher Hub">
        <div className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
          <h1 className={`text-2xl font-extrabold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Teacher approval required</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>This section is available after teacher account approval.</p>
          <Link href="/teacher" className="inline-block mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-900" style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)" }}>
            Back to Teacher Hub
          </Link>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      backHref="/teacher"
      backLabel="Teacher Hub"
      navLinks={[{ href: "/teacher/classroom/create", label: "Create Classroom" }, { href: "/classroom/reports?from=teacher", label: "Reports" }]}
      title="Classes"
      subtitle="Create classes and manage rosters."
    >
        <section className={`${teacherCardBorder} p-6 mb-6 ${teacherCardClass(light)}`}>
          <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Create Class</h2>
          <form onSubmit={onCreateClass} className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Class name"
              required
              className={`rounded-xl border px-3 py-2.5 text-sm ${input}`}
            />
            <input
              value={gradeLabel}
              onChange={(e) => setGradeLabel(e.target.value)}
              placeholder="Grade (optional)"
              className={`rounded-xl border px-3 py-2.5 text-sm ${input}`}
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              className={`rounded-xl border px-3 py-2.5 text-sm ${input}`}
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)" }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </section>

        <section className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
          <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Your Classes</h2>
          {loadingRows && <p className={`text-sm mt-4 ${textMuted}`}>Loading classes...</p>}
          {!loadingRows && rows.length === 0 && <p className={`text-sm mt-4 ${textMuted}`}>No classes yet.</p>}
          {!loadingRows && rows.length > 0 && (
            <div className="mt-4 divide-y divide-black/10 dark:divide-white/10">
              {rows.map((row) => (
                <Link key={row.id} href={`/teacher/classes/${row.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-85">
                  <div>
                    <p className={`text-sm font-semibold ${text}`}>{row.name}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {row.grade_label ?? "No grade"} · {row.subject ?? "No subject"} · {row.roster_count} students
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${light ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>{row.archived ? "Archived" : "Active"}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
    </TeacherLayout>
  );
}
