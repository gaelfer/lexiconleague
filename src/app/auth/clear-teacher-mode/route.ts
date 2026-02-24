import { NextResponse } from "next/server";

const TEACHER_MODE_COOKIE = "teacher_mode";

/** Clears teacher_mode cookie and redirects. Called after student login success. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete(TEACHER_MODE_COOKIE);

  return response;
}
