"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import TeacherLayout, { teacherCardBorder, teacherCardClass } from "@/components/TeacherLayout";
import { useTheme } from "@/context/ThemeContext";
import {
  addRosterStudent,
  approveClassJoinRequest,
  archiveTeacherClass,
  deleteTeacherClass,
  importRosterCsv,
  listClassJoinRequests,
  listClassRoster,
  listTeacherClasses,
  rejectClassJoinRequest,
  updateTeacherClass,
} from "@/lib/supabase/teacher-portal";
import type { ClassJoinRequest } from "@/lib/supabase/teacher-portal";
import { parseRosterCsv } from "@/lib/teacher/csv";
import { useTeacherPortalAccess } from "@/lib/teacher/useTeacherPortalAccess";
import InkAvatar from "@/components/InkAvatar";
import { CsvImportResultRow, RosterStudent, TeacherClass } from "@/types";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

export default function TeacherClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const router = useRouter();
  const { light } = useTheme();
  const { checking, isAuthenticated, portalEnabled, status } = useTeacherPortalAccess();

  const [teacherClass, setTeacherClass] = useState<TeacherClass | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [gradeLabel, setGradeLabel] = useState("");
  const [subject, setSubject] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [notes, setNotes] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const [csvInput, setCsvInput] = useState("");
  const [csvErrors, setCsvErrors] = useState<CsvImportResultRow[]>([]);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [joinRequests, setJoinRequests] = useState<ClassJoinRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [assignNameFor, setAssignNameFor] = useState<string | null>(null);
  const [assignNameValue, setAssignNameValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    const [classesRes, rosterRes, requestsRes] = await Promise.all([
      listTeacherClasses(),
      listClassRoster(classId),
      listClassJoinRequests(classId),
    ]);

    if (!classesRes.success) {
      setError(classesRes.error ?? "Could not load class");
      setLoading(false);
      return;
    }

    const currentClass = classesRes.rows.find((row) => row.id === classId) ?? null;
    if (!currentClass) {
      setError("Class not found");
      setLoading(false);
      return;
    }

    setTeacherClass(currentClass);
    setName(currentClass.name);
    setGradeLabel(currentClass.grade_label ?? "");
    setSubject(currentClass.subject ?? "");

    if (!rosterRes.success) {
      setError(rosterRes.error ?? "Could not load roster");
      setLoading(false);
      return;
    }

    setRoster(rosterRes.rows);
    setJoinRequests(requestsRes.success ? requestsRes.rows : []);
    setError(null);
    setLoading(false);
  }

  async function onApproveRequest(req: ClassJoinRequest) {
    const name = assignNameFor === req.id ? assignNameValue.trim() : (req.email ?? req.username ?? "Student");
    if (!name) return;
    setApprovingId(req.id);
    const res = await approveClassJoinRequest(req.id, name);
    setApprovingId(null);
    setAssignNameFor(null);
    setAssignNameValue("");
    if (res.success) await loadData();
    else setError(res.error ?? "Could not approve");
  }

  async function onRejectRequest(req: ClassJoinRequest) {
    setRejectingId(req.id);
    const res = await rejectClassJoinRequest(req.id);
    setRejectingId(null);
    if (res.success) await loadData();
    else setError(res.error ?? "Could not reject");
  }

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.replace(`/auth/login?next=/teacher/classes/${classId}`);
    }
  }, [checking, isAuthenticated, router, classId]);

  useEffect(() => {
    if (checking || !portalEnabled || !status?.teacher_approved) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [checking, portalEnabled, status?.teacher_approved, classId]);

  async function onSaveClass(event: FormEvent) {
    event.preventDefault();
    if (!teacherClass) return;

    setSavingClass(true);
    const result = await updateTeacherClass({
      classId: teacherClass.id,
      name: name.trim(),
      gradeLabel: gradeLabel.trim() || undefined,
      subject: subject.trim() || undefined,
    });
    setSavingClass(false);

    if (!result.success) {
      setError(result.error ?? "Could not update class");
      return;
    }

    await loadData();
  }

  async function onArchive() {
    if (!teacherClass) return;
    const result = await archiveTeacherClass(teacherClass.id, !teacherClass.archived);
    if (!result.success) {
      setError(result.error ?? "Could not update archive status");
      return;
    }
    await loadData();
  }

  async function onDelete() {
    if (!teacherClass || !teacherClass.archived) return;
    if (!window.confirm(`Permanently delete "${teacherClass.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const result = await deleteTeacherClass(teacherClass.id);
    setDeleting(false);
    if (!result.success) {
      setError(result.error ?? "Could not delete class");
      return;
    }
    router.push("/teacher/classes");
  }

  async function onAddStudent(event: FormEvent) {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Student name is required");
      return;
    }

    setAddingStudent(true);
    const result = await addRosterStudent({
      classId,
      displayName: displayName.trim(),
      studentIdentifier: studentIdentifier.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setAddingStudent(false);

    if (!result.success) {
      setError(result.error ?? "Could not add student");
      return;
    }

    setDisplayName("");
    setStudentIdentifier("");
    setNotes("");
    await loadData();
  }

  async function onImportCsv() {
    setCsvSummary(null);
    setCsvErrors([]);

    const parsed = parseRosterCsv(csvInput);
    if (parsed.rows.length === 0) {
      setCsvSummary("No valid rows to import.");
      setCsvErrors(parsed.errors.map((row) => ({ row: {}, error: `row ${row.rowNumber}: ${row.error}` })));
      return;
    }

    setImporting(true);
    const result = await importRosterCsv(classId, parsed.rows);
    setImporting(false);

    if (!result.success) {
      setError(result.error ?? "Could not import CSV");
      return;
    }

    const parserErrors: CsvImportResultRow[] = parsed.errors.map((row) => ({
      row: {},
      error: `row ${row.rowNumber}: ${row.error}`,
    }));

    setCsvErrors([...(result.errors ?? []), ...parserErrors]);
    setCsvSummary(`Imported ${result.inserted ?? 0} rows, skipped ${result.skipped ?? 0}.`);

    await loadData();
  }

  async function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvInput(text);
  }

  const card = light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const input = light
    ? "bg-white border-[#CBD5E1] text-[#0F172A] placeholder-[#64748B]"
    : "bg-[#0F172A] border-white/10 text-white placeholder-[#94A3B8]";

  const rosterTitle = useMemo(() => {
    if (!teacherClass) return "Roster";
    return `${teacherClass.name} Roster`;
  }, [teacherClass]);

  if (!portalEnabled) {
    return (
      <TeacherLayout>
        <p className={text}>Teacher portal is disabled.</p>
      </TeacherLayout>
    );
  }

  if (!status?.teacher_approved) {
    return (
      <TeacherLayout backHref="/teacher/hub" backLabel="Teacher Hub">
        <div className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
          <h1 className={`text-2xl font-extrabold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Teacher approval required</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>This section is available after teacher account approval.</p>
          <Link href="/teacher/hub" className="inline-block mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-900" style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)" }}>
            Back to Teacher Hub
          </Link>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      backHref="/teacher/classes"
      backLabel="All classes"
      navLinks={[{ href: "/teacher/classroom/create", label: "Create Classroom" }, { href: "/classroom/reports?from=teacher", label: "Reports" }]}
      title={rosterTitle}
      subtitle="Manage class metadata and students."
    >
        {loading && <p className={textMuted}>Loading class...</p>}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {!loading && teacherClass && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
              <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Class Settings</h2>
              <form onSubmit={onSaveClass} className="space-y-3 mt-4">
                <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${input}`} placeholder="Class name" required />
                <input value={gradeLabel} onChange={(e) => setGradeLabel(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${input}`} placeholder="Grade label" />
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${input}`} placeholder="Subject" />
                <button type="submit" disabled={savingClass} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)" }}>
                  {savingClass ? "Saving..." : "Save Class"}
                </button>
              </form>

              <button onClick={onArchive} className="w-full mt-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: teacherClass.archived ? "#0F766E" : "#B91C1C" }}>
                {teacherClass.archived ? "Unarchive Class" : "Archive Class"}
              </button>
              {teacherClass.archived && (
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="w-full mt-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white border-2 border-red-500/50 bg-red-950/50 hover:bg-red-900/50 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Class Permanently"}
                </button>
              )}
            </section>

            {teacherClass.join_code && (
              <section className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
                <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Share with Students</h2>
                <p className={`text-xs mt-1 ${textMuted}`}>Students with accounts can join using this code at lexiconleague.com/join-class</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-mono font-bold ${input}`}>{teacherClass.join_code}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(teacherClass.join_code ?? "")}
                      className="rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                      style={{ background: "#0EA5E9" }}
                    >
                      Copy code
                    </button>
                  </div>
                  <p className={`text-xs ${textMuted}`}>Share: {typeof window !== "undefined" ? window.location.origin : ""}/join-class</p>
                </div>
              </section>
            )}

            <section className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
              <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Add Student</h2>
              <form onSubmit={onAddStudent} className="space-y-3 mt-4">
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${input}`} placeholder="Display name" required />
                <input value={studentIdentifier} onChange={(e) => setStudentIdentifier(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${input}`} placeholder="Student identifier (optional)" />
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${input}`} placeholder="Notes (optional)" />
                <button type="submit" disabled={addingStudent} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: "#0EA5E9", boxShadow: "0 4px 14px rgba(14,165,233,0.4)" }}>
                  {addingStudent ? "Adding..." : "Add Student"}
                </button>
              </form>
            </section>

            <section className={`${teacherCardBorder} p-6 ${teacherCardClass(light)}`}>
              <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Import CSV</h2>
              <p className={`text-xs mt-1 ${textMuted}`}>Headers: `display_name`, `student_identifier`, `notes`.</p>
              <div className="mt-3 space-y-3">
                <input type="file" accept=".csv,text/csv" onChange={onFileInput} className={`w-full text-xs ${textMuted}`} />
                <textarea value={csvInput} onChange={(e) => setCsvInput(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm min-h-[140px] ${input}`} placeholder="Paste CSV content here" />
                <button type="button" onClick={onImportCsv} disabled={importing} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: "#7C3AED" }}>
                  {importing ? "Importing..." : "Import CSV"}
                </button>
              </div>
              {csvSummary && <p className="text-sm text-emerald-500 mt-3">{csvSummary}</p>}
              {csvErrors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {csvErrors.slice(0, 8).map((row, idx) => (
                    <p key={`${row.error}-${idx}`} className="text-xs text-red-500">{row.error}</p>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {!loading && teacherClass && joinRequests.length > 0 && (
          <section className={`${teacherCardBorder} p-6 mt-6 ${teacherCardClass(light)}`}>
            <h2 className={`text-lg font-bold ${text} mb-4`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Join Requests</h2>
            <p className={`text-sm ${textMuted} mb-4`}>Assign a display name and approve to add them to the roster.</p>
            <div className="space-y-3">
              {joinRequests.map((req) => (
                <div key={req.id} className={`flex items-center gap-3 p-3 rounded-xl ${light ? "bg-[#F8FAFC]" : "bg-white/5"}`}>
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...(req.avatar_config ?? {}) }} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${text}`}>{req.username ?? req.email ?? "Student"}</p>
                    <p className={`text-xs ${textMuted}`}>Requested to join</p>
                  </div>
                  {assignNameFor === req.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={assignNameValue}
                        onChange={(e) => setAssignNameValue(e.target.value)}
                        placeholder="Display name"
                        className={`rounded-lg border px-2.5 py-1.5 text-sm w-28 ${input}`}
                        autoFocus
                      />
                      <button
                        onClick={() => onApproveRequest(req)}
                        disabled={!assignNameValue.trim() || approvingId === req.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 disabled:opacity-50"
                      >
                        {approvingId === req.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => { setAssignNameFor(null); setAssignNameValue(""); }}
                        className={`text-xs ${textMuted}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAssignNameFor(req.id); setAssignNameValue(req.email ?? req.username ?? ""); }}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectRequest(req)}
                        disabled={rejectingId === req.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/70"}`}
                      >
                        {rejectingId === req.id ? "..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && teacherClass && (
          <section className={`${teacherCardBorder} p-6 mt-6 ${teacherCardClass(light)}`}>
            <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Roster ({roster.length})</h2>
            {roster.length === 0 ? (
              <p className={`text-sm mt-3 ${textMuted}`}>No students yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-black/10 dark:divide-white/10">
                {roster.map((student) => (
                  <div key={student.id} className="py-2.5">
                    <p className={`text-sm font-semibold ${text}`}>{student.display_name}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {student.student_identifier ?? "No ID"}
                      {student.notes ? ` · ${student.notes}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
    </TeacherLayout>
  );
}
