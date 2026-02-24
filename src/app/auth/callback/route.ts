import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TEACHER_MODE_COOKIE = "teacher_mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Sets teacher_mode cookie and redirects. Used when OAuth callback redirects to teacher. */
function redirectWithTeacherMode(origin: string, next: string) {
  const url = new URL(next, origin);
  const res = NextResponse.redirect(url);
  res.cookies.set(TEACHER_MODE_COOKIE, "1", {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

/** Clears teacher_mode cookie and redirects. Used when OAuth callback redirects to student area. */
function redirectWithoutTeacherMode(origin: string, next: string) {
  const url = new URL(next, origin);
  const res = NextResponse.redirect(url);
  res.cookies.delete(TEACHER_MODE_COOKIE);
  return res;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const errorParam = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;

  // OAuth provider returned an error (e.g. user cancelled)
  if (errorParam) {
    const errorDesc = requestUrl.searchParams.get("error_description") ?? errorParam;
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDesc)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const userMeta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const teacherSchoolId = typeof userMeta.teacher_school_id === "string" ? userMeta.teacher_school_id : null;
      const teacherSchoolEmail = typeof userMeta.teacher_school_email === "string" ? userMeta.teacher_school_email : null;
      const accountTypeIntent = typeof userMeta.account_type_intent === "string" ? userMeta.account_type_intent : null;
      const accountTypeMeta = typeof userMeta.account_type === "string" ? userMeta.account_type : null;

      const isTeacherFlow = next.startsWith("/teacher");

      if (accountTypeIntent === "teacher" && teacherSchoolId && teacherSchoolEmail) {
        const { data: verificationData } = await supabase.rpc("start_teacher_verification", {
          p_school_id: teacherSchoolId,
          p_school_email: teacherSchoolEmail,
        });

        const teacherApproved = Boolean((verificationData as { teacher_approved?: boolean } | null)?.teacher_approved);
        const teacherRedirect = teacherApproved ? "/teacher/hub" : "/teacher?pending=1";
        return redirectWithTeacherMode(origin, teacherRedirect);
      }

      // New teacher signup (email) — redirect to teacher portal (will send to onboarding)
      if (accountTypeMeta === "teacher" && isTeacherFlow) {
        return redirectWithTeacherMode(origin, "/teacher/hub");
      }

      // Check teacher_profiles (not profiles) for teacher status
      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("teacher_approved")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const isTeacher = !!teacherProfile;
      if (isTeacher && isTeacherFlow) {
        const teacherRedirect = teacherProfile.teacher_approved ? "/teacher/hub" : "/teacher?pending=1";
        return redirectWithTeacherMode(origin, teacherRedirect);
      }

      // Student flow: clear teacher mode, check onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single();

      const needsOnboarding = profile && profile.onboarding_completed === false;
      const redirectTo = needsOnboarding ? `/onboarding?next=${encodeURIComponent(next)}` : next;
      return redirectWithoutTeacherMode(origin, redirectTo);
    }

    // Code exchange failed — surface the error
    const errMsg = error?.message ?? "auth_failed";
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errMsg)}`);
  }

  // No code or provider error — redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
