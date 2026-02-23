import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const teacherToken = request.nextUrl.searchParams.get("teacherToken") ?? null;

  if (!sessionId) {
    return new Response("Missing session id", { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_classroom_report_csv", {
    p_session_id: sessionId,
    p_teacher_token: teacherToken,
  });

  if (error) {
    return new Response(error.message, { status: 403 });
  }

  if (!data || typeof data !== "string" || data.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=classroom-report-${sessionId}.csv`,
      "Cache-Control": "no-store",
    },
  });
}
