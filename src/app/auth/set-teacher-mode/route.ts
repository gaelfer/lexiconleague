import { NextResponse } from "next/server";

const TEACHER_MODE_COOKIE = "teacher_mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Sets teacher_mode cookie and redirects. Called after teacher-login success. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/teacher";

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(TEACHER_MODE_COOKIE, "1", {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
