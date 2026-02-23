import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/party/dissolve
 * Called via navigator.sendBeacon when the leader closes their browser.
 * Deletes the leader's party_members row, which triggers the DB trigger
 * that sets party.status = 'dissolved'.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { partyId, userId } = body as { partyId?: string; userId?: string };

    if (!partyId || !userId) {
      return NextResponse.json({ error: "Missing partyId or userId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // read-only in route handler, safe to ignore
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the leader's party_members row — DB trigger dissolves the party
    await supabase
      .from("party_members")
      .delete()
      .eq("user_id", userId)
      .eq("party_id", partyId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
