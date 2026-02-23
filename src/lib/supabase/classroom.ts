"use client";

import { createClient } from "@/lib/supabase/client";
import { Subject } from "@/types";

export interface ClassroomFeatureFlags {
  classroom_persistence_v1: boolean;
  classroom_reports_v1: boolean;
  classroom_access_code_v1: boolean;
}

const TEACHER_TOKEN_PREFIX = "ll_classroom_teacher_token_";

function tokenKey(roomCode: string): string {
  return `${TEACHER_TOKEN_PREFIX}${roomCode.toUpperCase()}`;
}

export function saveTeacherToken(roomCode: string, teacherToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(tokenKey(roomCode), teacherToken);
}

export function getTeacherToken(roomCode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(tokenKey(roomCode));
}

export interface TeacherAccess {
  roomId: string;
  roomCode: string;
  teacherToken: string;
  expiresAt: string;
}

export interface StartClassroomSessionInput {
  roomCode: string;
  seed: string;
  subject: Subject;
  vocabLevel?: string;
  punctuationLevel?: number;
  hostPlays: boolean;
  startedAtIso: string;
  allowLateJoin?: boolean;
  teacherToken?: string;
}

export interface SubmitClassroomResultInput {
  sessionId: string;
  participantKey: string;
  userId?: string;
  username: string;
  role: "host" | "student";
  score: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  finishedAtIso: string;
  skillBreakdown?: Record<string, unknown>;
}

export interface ClassroomReportRow {
  participant_id: string;
  display_name: string;
  role: "host" | "student";
  joined_at: string | null;
  left_at: string | null;
  was_kicked: boolean;
  score: number | null;
  correct: number | null;
  incorrect: number | null;
  accuracy: number | null;
  finished_at: string | null;
  skill_breakdown: Record<string, unknown>;
}

export interface ClassroomReport {
  session: {
    id: string;
    room_code: string;
    subject: Subject;
    vocab_level: string | null;
    punctuation_level: number | null;
    host_plays: boolean;
    started_at: string;
    ended_at: string | null;
    status: "running" | "completed" | "aborted";
    ended_reason: string | null;
  };
  rows: ClassroomReportRow[];
}

export interface ClassroomReportListRow {
  session_id: string;
  room_code: string;
  subject: Subject;
  vocab_level: string | null;
  punctuation_level: number | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  participants: number;
  submitted_results: number;
}

function toFlags(rows: Array<{ key: string; enabled: boolean }> | null): ClassroomFeatureFlags {
  const out: ClassroomFeatureFlags = {
    classroom_persistence_v1: false,
    classroom_reports_v1: false,
    classroom_access_code_v1: false,
  };

  for (const row of rows ?? []) {
    if (row.key in out) {
      out[row.key as keyof ClassroomFeatureFlags] = Boolean(row.enabled);
    }
  }
  return out;
}

export async function getClassroomFeatureFlags(): Promise<ClassroomFeatureFlags> {
  const supabase = createClient();
  const { data } = await supabase
    .from("classroom_feature_flags")
    .select("key, enabled")
    .in("key", ["classroom_persistence_v1", "classroom_reports_v1", "classroom_access_code_v1"]);
  return toFlags(data as Array<{ key: string; enabled: boolean }> | null);
}

export async function validateClassroomJoin(roomCode: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("validate_classroom_join", {
    p_room_code: roomCode,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Could not join room" };
  return { success: true };
}

export async function createClassroomRoom(
  roomCode: string,
  teacherCode: string,
  maxPlayers = 30
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_classroom_room", {
    p_room_code: roomCode,
    p_teacher_code_plain: teacherCode,
    p_max_players: maxPlayers,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Failed to create room" };
  return { success: true, roomId: data.room_id as string };
}

export async function verifyTeacherAccess(
  roomCode: string,
  teacherCode: string
): Promise<{ success: boolean; access?: TeacherAccess; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("verify_teacher_access", {
    p_room_code: roomCode,
    p_teacher_code_plain: teacherCode,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Invalid teacher code" };

  return {
    success: true,
    access: {
      roomId: data.room_id as string,
      roomCode: data.room_code as string,
      teacherToken: data.teacher_token as string,
      expiresAt: data.expires_at as string,
    },
  };
}

export async function startClassroomSession(
  input: StartClassroomSessionInput
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const supabase = createClient();
  const config = {
    subject: input.subject,
    vocabLevel: input.vocabLevel,
    punctuationLevel: input.punctuationLevel,
    hostPlays: input.hostPlays,
    startedAt: input.startedAtIso,
    allowLateJoin: input.allowLateJoin ?? false,
    teacherToken: input.teacherToken,
  };
  const { data, error } = await supabase.rpc("start_classroom_session", {
    p_room_code: input.roomCode,
    p_seed: input.seed,
    p_config_json: config,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Could not start session" };
  return { success: true, sessionId: data.session_id as string };
}

export async function submitClassroomResult(
  input: SubmitClassroomResultInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const payload = {
    userId: input.userId,
    username: input.username,
    role: input.role,
    score: input.score,
    correct: input.correct,
    incorrect: input.incorrect,
    accuracy: input.accuracy,
    finishedAt: input.finishedAtIso,
    skillBreakdown: input.skillBreakdown ?? {},
  };

  const { data, error } = await supabase.rpc("submit_classroom_result", {
    p_session_id: input.sessionId,
    p_participant_key: input.participantKey,
    p_result_json: payload,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Could not save result" };
  return { success: true };
}

export async function finalizeClassroomSession(
  sessionId: string,
  endedReason: string,
  teacherToken?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("finalize_classroom_session", {
    p_session_id: sessionId,
    p_ended_reason: endedReason,
    p_teacher_token: teacherToken ?? null,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Could not finalize session" };
  return { success: true };
}

export async function listClassroomReports(options?: {
  roomCode?: string;
  subject?: Subject | "all";
  days?: number;
  teacherToken?: string;
}): Promise<{ success: boolean; rows: ClassroomReportListRow[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_classroom_reports", {
    p_room_code: options?.roomCode ?? null,
    p_subject: options?.subject && options.subject !== "all" ? options.subject : null,
    p_days: options?.days ?? 30,
    p_teacher_token: options?.teacherToken ?? null,
  });

  if (error) return { success: false, rows: [], error: error.message };
  if (!data?.success) return { success: false, rows: [], error: data?.error ?? "Could not load reports" };
  return { success: true, rows: (data.rows ?? []) as ClassroomReportListRow[] };
}

export async function getClassroomReport(
  sessionId: string,
  teacherToken?: string
): Promise<{ success: boolean; report?: ClassroomReport; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_classroom_report", {
    p_session_id: sessionId,
    p_teacher_token: teacherToken ?? null,
  });

  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Could not load report" };

  return {
    success: true,
    report: {
      session: data.session as ClassroomReport["session"],
      rows: (data.rows ?? []) as ClassroomReportRow[],
    },
  };
}

export async function logClassroomEvent(
  eventName: string,
  options?: { sessionId?: string; userId?: string; properties?: Record<string, unknown> }
): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("log_app_event", {
    p_event_name: eventName,
    p_user_id: options?.userId ?? null,
    p_session_id: options?.sessionId ?? null,
    p_properties: options?.properties ?? {},
  });
}
