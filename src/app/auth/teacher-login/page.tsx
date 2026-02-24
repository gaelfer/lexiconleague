"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithUsernameOrEmail } from "@/app/auth/actions";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import LogoIcon from "@/components/icons/LogoIcon";
import { DARK, CARD, SURFACE } from "@/lib/design-tokens";

const AMBER = "#F59E0B";
const AMBER_DARK = "#D97706";
const GOLD = "#FBBF24";

function TeacherLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/teacher";
  const { light } = useTheme();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signInWithUsernameOrEmail(usernameOrEmail, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(next);
        router.refresh();
      }
    });
  }

  const textCls = light ? "text-[#0F172A]" : "text-white";
  const textMutedCls = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const inputBg = light ? "bg-white" : CARD;
  const inputBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const inputFocus = light ? "focus:border-amber-400 focus:ring-amber-400/20" : "focus:border-amber-500 focus:ring-amber-500/20";

  return (
    <main className={`min-h-screen flex ${light ? "bg-[#FAFAF9]" : ""}`} style={!light ? { background: SURFACE } : undefined}>
      {/* Left panel — teacher amber theme */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden"
        style={light ? { background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)` } : { background: DARK, borderRight: "1px solid rgba(245,158,11,0.15)" }}
      >
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${AMBER} 0%, transparent 65%)`, transform: "translate(30%, -50%)" }} />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 65%)`, transform: "translate(-30%, 0)" }} />

        <div className="relative z-10 text-center px-12 space-y-8">
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden p-1"
              style={light ? { background: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" } : { background: CARD, border: `1px solid ${AMBER}40` }}
            >
              <LogoIcon className="w-full h-full" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-extrabold leading-tight font-display" style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif" }}>
              Teacher
              <br />
              <span style={{ color: light ? "rgba(255,255,255,0.95)" : GOLD }}>Portal</span>
            </h1>
            <p className="text-lg mt-4 font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              Run live vocabulary sessions for your class.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-left">
            {[
              { text: "Create classes & share join codes", color: "rgba(255,255,255,0.9)" },
              { text: "Host live 20+ player sessions", color: "rgba(255,255,255,0.85)" },
              { text: "View reports & export to CSV", color: "rgba(255,255,255,0.8)" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-white font-semibold text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${light ? "bg-[#FAFAF9]" : ""}`} style={!light ? { background: SURFACE } : undefined}>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <Link href="/teacher" className="text-sm font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: light ? "#64748B" : "#94A3B8" }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Teacher Portal
            </Link>
            <ThemeToggle />
          </div>
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <LogoIcon className="w-12 h-12" />
            <span className={`text-2xl font-extrabold ${textCls}`} style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Lexicon<span style={{ color: AMBER }}>League</span>
            </span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4" style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}40` }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Teacher sign in
            </div>
            <h2 className={`text-3xl font-extrabold mb-1 font-display ${textCls}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Welcome back
            </h2>
            <p className={`text-sm font-medium ${textMutedCls}`}>
              Use your school email to sign in. After signing in, you&apos;ll complete setup (choose your school, grade, subject).
            </p>
            <p className={`text-sm font-medium mt-2 ${textMutedCls}`}>
              <Link href="/auth/teacher-signup" className="font-bold hover:underline" style={{ color: AMBER }}>
                New teacher? Create account
              </Link>
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <p className={`text-xs ${textMutedCls} mb-2`}>
              Student? <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: AMBER }}>Sign in as student</Link>
            </p>

            <div className="space-y-1.5">
              <label className={`block text-sm font-bold ${textCls}`}>Username or email</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="username or you@school.edu"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-sm font-bold ${textCls}`}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl font-extrabold text-slate-900 text-base transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`, boxShadow: `0 4px 12px ${AMBER}40` }}
            >
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className={`mt-6 text-center text-xs font-medium ${textMutedCls}`}>
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:opacity-80">Terms</span>
            {" "}and{" "}
            <span className="underline cursor-pointer hover:opacity-80">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function TeacherLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: SURFACE }} />}>
      <TeacherLoginPageInner />
    </Suspense>
  );
}
