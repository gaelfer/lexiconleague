"use client";

import {
  ClassroomReportListRow,
  getClassroomFeatureFlags,
  listClassroomReports,
} from "@/lib/supabase/classroom";
import { createClient } from "@/lib/supabase/client";
import {
  Classmate,
  CsvImportResultRow,
  RosterStudent,
  School,
  StudentClass,
  TeacherClass,
  TeacherPortalStatus,
} from "@/types";

export type { ClassroomReportListRow };

interface RpcResult {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

export async function isTeacherPortalEnabled(): Promise<boolean> {
  const flags = await getClassroomFeatureFlags();
  const supabase = createClient();
  const { data } = await supabase
    .from("classroom_feature_flags")
    .select("enabled")
    .eq("key", "teacher_portal_v1")
    .maybeSingle();

  // Keep fallback compatibility in case old environments haven't added the flag row yet.
  return Boolean(data?.enabled ?? flags.classroom_reports_v1);
}

export async function searchSchools(query: string, limit = 10): Promise<{ success: boolean; rows: School[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_schools", {
    p_query: query,
    p_limit: limit,
  });

  if (error) return { success: false, rows: [], error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, rows: [], error: (payload.error as string) ?? "Could not search schools" };
  return { success: true, rows: (payload.rows as School[] | undefined) ?? [] };
}

export async function completeHomeschoolTeacherOnboarding(
  grade: string,
  subject?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("complete_homeschool_teacher_onboarding", {
    p_grade: grade,
    p_subject: subject ?? null,
  });
  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  return { success: Boolean(payload.success), error: payload.error as string | undefined };
}

export async function completePublicTeacherOnboarding(
  schoolId: string,
  schoolEmail: string,
  grade?: string,
  subject?: string
): Promise<{ success: boolean; status?: string; teacherApproved?: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("complete_public_teacher_onboarding", {
    p_school_id: schoolId,
    p_school_email: schoolEmail,
    p_grade: grade ?? null,
    p_subject: subject ?? null,
  });
  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not complete onboarding" };
  return {
    success: true,
    status: payload.status as string,
    teacherApproved: Boolean(payload.teacher_approved),
  };
}

export async function startTeacherVerification(
  schoolId: string,
  schoolEmail: string
): Promise<{ success: boolean; status?: string; teacherApproved?: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("start_teacher_verification", {
    p_school_id: schoolId,
    p_school_email: schoolEmail,
  });

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not start verification" };
  return {
    success: true,
    status: payload.status as string,
    teacherApproved: Boolean(payload.teacher_approved),
  };
}

export async function getTeacherPortalStatus(): Promise<{ success: boolean; status?: TeacherPortalStatus; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_teacher_portal_status");

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not load teacher status" };

  return {
    success: true,
    status: {
      account_type: (payload.account_type as "student" | "teacher") ?? "student",
      teacher_approved: Boolean(payload.teacher_approved),
      teacher_school_id: (payload.teacher_school_id as string | null) ?? null,
      teacher_verified_at: (payload.teacher_verified_at as string | null) ?? null,
      teacher_type: (payload.teacher_type as "homeschool" | "public" | null) ?? null,
      teacher_grade: (payload.teacher_grade as string | null) ?? null,
      teacher_subject: (payload.teacher_subject as string | null) ?? null,
      teacher_onboarding_completed: Boolean(payload.teacher_onboarding_completed),
      verification_status: (payload.verification_status as TeacherPortalStatus["verification_status"]) ?? null,
      verification_reason: (payload.verification_reason as string | null) ?? null,
      verification_created_at: (payload.verification_created_at as string | null) ?? null,
      verification_reviewed_at: (payload.verification_reviewed_at as string | null) ?? null,
    },
  };
}

export async function createTeacherClass(input: {
  name: string;
  gradeLabel?: string;
  subject?: string;
  schoolId?: string;
}): Promise<{ success: boolean; classId?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_class", {
    p_name: input.name,
    p_grade_label: input.gradeLabel ?? null,
    p_subject: input.subject ?? null,
    p_school_id: input.schoolId ?? null,
  });

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not create class" };
  return { success: true, classId: payload.class_id as string };
}

export async function updateTeacherClass(input: {
  classId: string;
  name: string;
  gradeLabel?: string;
  subject?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("update_class", {
    p_class_id: input.classId,
    p_name: input.name,
    p_grade_label: input.gradeLabel ?? null,
    p_subject: input.subject ?? null,
  });

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not update class" };
  return { success: true };
}

export async function archiveTeacherClass(classId: string, archived = true): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("archive_class", {
    p_class_id: classId,
    p_archived: archived,
  });

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not archive class" };
  return { success: true };
}

export async function listTeacherClasses(): Promise<{ success: boolean; rows: TeacherClass[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_teacher_classes");

  if (error) return { success: false, rows: [], error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, rows: [], error: (payload.error as string) ?? "Could not load classes" };
  return { success: true, rows: (payload.rows as TeacherClass[] | undefined) ?? [] };
}

export async function addRosterStudent(input: {
  classId: string;
  displayName: string;
  studentIdentifier?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_roster_student", {
    p_class_id: input.classId,
    p_display_name: input.displayName,
    p_student_identifier: input.studentIdentifier ?? null,
    p_notes: input.notes ?? null,
  });

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not add student" };
  return { success: true, id: payload.id as string };
}

export async function listClassRoster(classId: string): Promise<{ success: boolean; rows: RosterStudent[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_class_roster", {
    p_class_id: classId,
  });

  if (error) return { success: false, rows: [], error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, rows: [], error: (payload.error as string) ?? "Could not load roster" };
  return { success: true, rows: (payload.rows as RosterStudent[] | undefined) ?? [] };
}

export interface CsvRosterRow {
  display_name: string;
  student_identifier?: string;
  notes?: string;
}

export async function importRosterCsv(classId: string, rows: CsvRosterRow[]): Promise<{
  success: boolean;
  inserted?: number;
  skipped?: number;
  errors?: CsvImportResultRow[];
  error?: string;
}> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("import_roster_csv", {
    p_class_id: classId,
    p_rows: rows,
  });

  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not import roster" };
  return {
    success: true,
    inserted: Number(payload.inserted ?? 0),
    skipped: Number(payload.skipped ?? 0),
    errors: ((payload.errors as CsvImportResultRow[] | undefined) ?? []),
  };
}

export async function listTeacherRecentSessions(limit = 8): Promise<{ success: boolean; rows: ClassroomReportListRow[]; error?: string }> {
  try {
    const reports = await listClassroomReports({ days: 30 });
    if (!reports.success) {
      return { success: false, rows: [], error: reports.error ?? "Could not load sessions" };
    }
    return { success: true, rows: reports.rows.slice(0, Math.max(1, limit)) };
  } catch (error) {
    return { success: false, rows: [], error: toErrorMessage(error, "Could not load sessions") };
  }
}

export async function requestClassJoin(joinCode: string): Promise<{ success: boolean; classId?: string; alreadyMember?: boolean; pending?: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("request_class_join", {
    p_join_code: joinCode.trim().toUpperCase(),
  });
  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not request to join" };
  return {
    success: true,
    classId: payload.class_id as string | undefined,
    alreadyMember: Boolean(payload.already_member),
    pending: Boolean(payload.pending),
  };
}

export interface ClassJoinRequest {
  id: string;
  user_id: string;
  status: string;
  assigned_display_name?: string | null;
  created_at: string;
  username?: string | null;
  email?: string | null;
  avatar_config?: Record<string, unknown> | null;
}

export async function listClassJoinRequests(classId: string): Promise<{ success: boolean; rows: ClassJoinRequest[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_class_join_requests", { p_class_id: classId });
  if (error) return { success: false, rows: [], error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, rows: [], error: (payload.error as string) ?? "Could not load requests" };
  return { success: true, rows: (payload.rows as ClassJoinRequest[] | undefined) ?? [] };
}

export async function approveClassJoinRequest(requestId: string, displayName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("approve_class_join_request", {
    p_request_id: requestId,
    p_display_name: displayName.trim(),
  });
  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not approve" };
  return { success: true };
}

export async function rejectClassJoinRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("reject_class_join_request", { p_request_id: requestId });
  if (error) return { success: false, error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, error: (payload.error as string) ?? "Could not reject" };
  return { success: true };
}

export async function listStudentClasses(): Promise<{ success: boolean; rows: StudentClass[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_student_classes");
  if (error) return { success: false, rows: [], error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, rows: [], error: (payload.error as string) ?? "Could not load classes" };
  return { success: true, rows: (payload.rows as StudentClass[] | undefined) ?? [] };
}

export async function listClassmates(classId: string): Promise<{ success: boolean; rows: Classmate[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_classmates", { p_class_id: classId });
  if (error) return { success: false, rows: [], error: error.message };
  const payload = (data ?? {}) as RpcResult;
  if (!payload.success) return { success: false, rows: [], error: (payload.error as string) ?? "Could not load classmates" };
  return { success: true, rows: (payload.rows as Classmate[] | undefined) ?? [] };
}
