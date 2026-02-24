import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

      if (accountTypeIntent === "teacher" && teacherSchoolId && teacherSchoolEmail) {
        const { data: verificationData } = await supabase.rpc("start_teacher_verification", {
          p_school_id: teacherSchoolId,
          p_school_email: teacherSchoolEmail,
        });

        const teacherApproved = Boolean((verificationData as { teacher_approved?: boolean } | null)?.teacher_approved);
        const teacherRedirect = teacherApproved ? "/teacher" : "/teacher?pending=1";
        return NextResponse.redirect(`${origin}${teacherRedirect}`);
      }

      // New teacher signup (email) — redirect to teacher portal (will send to onboarding)
      if (accountTypeMeta === "teacher" && next.startsWith("/teacher")) {
        return NextResponse.redirect(`${origin}/teacher`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, account_type, teacher_approved")
        .eq("id", data.user.id)
        .single();

      const isTeacher = profile?.account_type === "teacher";
      if (isTeacher) {
        const teacherRedirect = profile.teacher_approved ? "/teacher" : "/teacher?pending=1";
        return NextResponse.redirect(`${origin}${teacherRedirect}`);
      }

      const needsOnboarding = profile && profile.onboarding_completed === false;
      const redirectTo = needsOnboarding ? `/onboarding?next=${encodeURIComponent(next)}` : next;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    // Code exchange failed — surface the error
    const errMsg = error?.message ?? "auth_failed";
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errMsg)}`);
  }

  // No code or provider error — redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
