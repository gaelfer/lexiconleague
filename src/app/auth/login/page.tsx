"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectBase } from "@/lib/auth/redirect";
import { signInWithUsernameOrEmail } from "@/app/auth/actions";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleIcon from "@/components/icons/GoogleIcon";
import LogoIcon from "@/components/icons/LogoIcon";
import MailIcon from "@/components/icons/MailIcon";
import { MINT, BLUE, DARK, CARD, SURFACE } from "@/lib/design-tokens";

type View = "providers" | "email";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const isTeacherFlow = next === "/teacher" || next?.startsWith("/teacher");
  const { light } = useTheme();
  const [view, setView] = useState<View>(isTeacherFlow ? "email" : "providers");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Show error from callback redirect (e.g. OAuth failed)
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  async function handleOAuth(provider: "google" | "apple" | "azure") {
    setError("");
    const supabase = createClient();
    const callbackUrl = `${getAuthRedirectBase()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
        ...(provider === "google" && {
          queryParams: { access_type: "offline" },
        }),
        ...(provider === "azure" && { scopes: "email profile openid" }),
      },
    });
    if (error) setError(error.message);
  }

  function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signInWithUsernameOrEmail(usernameOrEmail, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/auth/clear-teacher-mode?next=${encodeURIComponent(next)}`);
        router.refresh();
      }
    });
  }

  const panelBg = light ? "bg-[#F8FAFC]" : SURFACE;
  const textCls = light ? "text-[#0F172A]" : "text-white";
  const textMutedCls = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const inputBg = light ? "bg-white" : CARD;
  const inputBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const inputFocus = light ? "focus:border-[#3B82F6]" : "focus:border-[#3B82F6]/60";
  const btnSecondary = light
    ? "bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#BFDBFE]"
    : "bg-[#1E293B] border-white/10 text-white hover:bg-[#334155] hover:border-white/20";

  return (
    <main className={`min-h-screen flex ${light ? "bg-[#F8FAFC]" : ""}`} style={!light ? { background: SURFACE } : undefined}>
      {/* Left panel — decorative (marketing style) */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden"
        style={light ? { background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" } : { background: DARK, borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Ambient glows */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 65%)`, transform: "translate(30%, -50%)" }} />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle, ${MINT} 0%, transparent 65%)`, transform: "translate(-30%, 0)" }} />

        <div className="relative z-10 text-center px-12 space-y-8">
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden p-1"
              style={light ? { background: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" } : { background: CARD, border: "1px solid rgba(52,211,153,0.22)" }}
            >
              <LogoIcon className="w-full h-full" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-extrabold leading-tight font-display" style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif" }}>
              Lexicon
              <br />
              <span style={{ color: MINT }}>League</span>
            </h1>
            <p className="text-lg mt-4 font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              Words are your superpower.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-left">
            {[
              { text: "Climb from Bronze to Emerald", color: MINT },
              { text: "60-second vocab sprints", color: "#60A5FA" },
              { text: "Beat your personal best", color: "#6EE7B7" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-white font-semibold text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${panelBg}`} style={!light ? { background: SURFACE } : undefined}>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            {(next === "/teacher" || next?.startsWith("/teacher")) ? (
              <Link href="/teacher" className="text-sm font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: light ? "#64748B" : "#94A3B8" }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                Back to Teacher Portal
              </Link>
            ) : (
              <span />
            )}
            <ThemeToggle />
          </div>
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <LogoIcon className="w-12 h-12" />
            <span className={`text-2xl font-extrabold ${textCls}`} style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Lexicon<span style={{ color: BLUE }}>League</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold mb-1 font-display ${textCls}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {isTeacherFlow ? "Teacher sign in" : "Welcome back!"}
            </h2>
            <p className={`text-sm font-medium ${textMutedCls}`}>
              {isTeacherFlow ? (
                <>Use your school email to sign in. Google sign-in is for student accounts only.</>
              ) : (
                <>
                  Sign in to continue your journey.{" "}
                  <Link href="/auth/signup" className="font-bold hover:underline" style={{ color: BLUE }}>
                    New here? Join free
                  </Link>
                </>
              )}
            </p>
            {isTeacherFlow && (
              <p className={`text-sm font-medium mt-1 ${textMutedCls}`}>
                <Link href="/auth/signup?next=/teacher" className="font-bold hover:underline" style={{ color: BLUE }}>
                  New teacher? Create account
                </Link>
              </p>
            )}
          </div>

          {view === "providers" && !isTeacherFlow ? (
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth("google")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-bold text-sm ${btnSecondary}`}
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-center">Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: light ? "#E2E8F0" : "rgba(255,255,255,0.1)" }} />
                <span className={`text-xs font-bold ${textMutedCls}`}>or</span>
                <div className="flex-1 h-px" style={{ background: light ? "#E2E8F0" : "rgba(255,255,255,0.1)" }} />
              </div>

              <button
                onClick={() => setView("email")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-bold text-sm ${btnSecondary}`}
              >
                <MailIcon className={`w-5 h-5 shrink-0 ${textMutedCls}`} />
                <span className="flex-1 text-center">Continue with Email</span>
              </button>

              {error && (
                <div className="mt-2 px-4 py-3 rounded-xl text-sm font-medium text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                  {error}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {!isTeacherFlow && (
                <button
                  type="button"
                  onClick={() => { setView("providers"); setError(""); }}
                  className={`flex items-center gap-1.5 text-sm font-semibold mb-4 transition-colors ${textMutedCls} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                  </svg>
                  All sign-in options
                </button>
              )}
              {isTeacherFlow && (
                <p className={`text-xs ${textMutedCls} mb-2`}>
                  Student? <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: BLUE }}>Sign in as student</Link>
                </p>
              )}

              <div className="space-y-1.5">
                <label className={`block text-sm font-bold ${textCls}`}>Username or email</label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="username or you@example.com"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
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
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
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
                className="w-full py-3.5 rounded-xl font-extrabold text-white text-base transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #1D4ED8 100%)`, boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}
              >
                {isPending ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: SURFACE }} />}>
      <LoginPageInner />
    </Suspense>
  );
}
