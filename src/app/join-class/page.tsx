"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { requestClassJoin } from "@/lib/supabase/teacher-portal";
import { BLUE } from "@/lib/design-tokens";

export default function JoinClassPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { light } = useTheme();
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?next=/join-class");
    }
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setRequesting(true);
    const res = await requestClassJoin(code.trim().toUpperCase());
    setRequesting(false);
    if (!res.success) {
      setError(res.error ?? "Could not request to join");
      return;
    }
    if (res.alreadyMember) {
      router.push("/dashboard");
      return;
    }
    if (res.pending) {
      setError("");
      setCode("");
      router.push("/dashboard?class_requested=1");
      return;
    }
    router.push("/dashboard");
  }

  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const input = light ? "bg-white border-[#E2E8F0] text-[#0F172A]" : "bg-[#0F172A] border-white/10 text-white";

  if (loading || !user) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className={textMuted}>Loading…</p>
      </main>
    );
  }

  return (
    <main className={`min-h-[100dvh] px-4 py-10 ${light ? "bg-[#F8FAFC]" : "bg-[#0F172A]"}`}>
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className={`text-sm font-semibold ${textMuted} hover:opacity-80 flex items-center gap-1.5 mb-8`}>
          ← Back to Dashboard
        </Link>
        <div className={`rounded-2xl border p-6 ${cardBg} ${cardBorder}`}>
          <h1 className={`text-xl font-bold ${text}`}>Request to Join a Class</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Enter the class code your teacher shared. Your teacher will approve and assign you a name.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${text} mb-1.5`}>Class code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={8}
                className={`w-full rounded-xl border px-4 py-3 text-sm ${input}`}
                required
              />
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={requesting || !code.trim()}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: BLUE }}
            >
              {requesting ? "Sending request…" : "Request to Join"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
