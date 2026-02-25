"use client";

export const dynamic = "force-dynamic";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectBase } from "@/lib/auth/redirect";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleIcon from "@/components/icons/GoogleIcon";
import LogoIcon from "@/components/icons/LogoIcon";
import MailIcon from "@/components/icons/MailIcon";
import { MINT, BLUE, DARK, CARD, SURFACE } from "@/lib/design-tokens";

type View = "providers" | "email";

const GATE_MESSAGES: Record<string, string> = {
  shop: "Sign up to claim daily Ink Drop rewards and buy cosmetics!",
  locker: "Sign up to customize your Ink Avatar!",
  ranked: "Sign up to compete in Ranked Mode!",
};

const GRADES = ["Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "English 1", "English 2", "English 3", "AP Language & Comp", "AP Literature & Comp", "Other"];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: SURFACE }} />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("from") ?? "";
  const next = searchParams.get("next") ?? "";
  const gateMessage = GATE_MESSAGES[fromPage] ?? "";
  const isTeacherFlow = next === "/teacher" || next.startsWith("/teacher");
  const [view, setView] = useState<View>(isTeacherFlow ? "email" : "providers");

  const { light } = useTheme();
  const [username, setUsername] = useState("");
  const [grade, setGrade] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

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

  function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const emailRedirectTo = `${getAuthRedirectBase()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, grade },
          emailRedirectTo,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Almost there! Check your email to confirm your account.");
      }
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: light ? "#F8FAFC" : SURFACE }}>
        <div className="text-center max-w-sm space-y-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: light ? "#ECFDF5" : `${MINT}20`, border: `2px solid ${MINT}` }}>
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke={MINT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold font-display" style={{ color: light ? "#0F172A" : "white", fontFamily: "'Playfair Display', Georgia, serif" }}>Check your inbox!</h2>
          <p className="text-sm font-medium" style={{ color: light ? "#64748B" : "#94A3B8" }}>{success}</p>
          <Link
            href={isTeacherFlow ? "/auth/login?next=/teacher" : "/auth/login"}
            className="inline-block px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #1D4ED8 100%)`, boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}
          >
            Back to Sign In
          </Link>
        </div>
      </main>
    );
  }

  const inputBg = light ? "bg-white" : CARD;
  const inputBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const inputFocus = light ? "focus:border-[#3B82F6]" : "focus:border-[#3B82F6]/60";
  const btnSecondary = light
    ? "bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#BFDBFE]"
    : "bg-[#1E293B] border-white/10 text-white hover:bg-[#334155] hover:border-white/20";

  return (
    <main className="min-h-screen flex" style={!light ? { background: SURFACE } : undefined}>
      {/* Left panel — marketing style */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden"
        style={light ? { background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" } : { background: DARK, borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
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
            <h1 className="text-5xl font-extrabold text-white leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Join the
              <br />
              <span style={{ color: MINT }}>League</span>
            </h1>
            <p className="text-white/90 text-lg mt-4 font-semibold">
              Your rank journey starts here.
            </p>
          </div>
          <div className="space-y-2 mt-6">
            {[
              { label: "Bronze", color: "#CD7F32", width: "20%", cartoony: true },
              { label: "Silver", color: "#C0C0C0", width: "38%" },
              { label: "Gold", color: "#D4AF37", width: "55%" },
              { label: "Platinum", color: "#7DD3FC", width: "72%" },
              { label: "Diamond", color: "#A78BFA", width: "88%" },
              { label: "Emerald", color: "#10B981", width: "100%" },
            ].map((tier) => (
              <div key={tier.label} className={`flex items-center gap-3 ${tier.cartoony ? "transform hover:scale-[1.02] transition-transform" : ""}`}>
                <span className={`text-xs font-bold w-16 text-right text-white/90 ${tier.cartoony ? "font-extrabold drop-shadow-sm" : ""}`}>{tier.label}</span>
                <div className={`flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden ${tier.cartoony ? "rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]" : ""}`}>
                  <div
                    className={`h-full rounded-full transition-all ${tier.cartoony ? "rounded-2xl" : ""}`}
                    style={{
                      width: tier.width,
                      background: tier.cartoony ? `linear-gradient(90deg, ${tier.color} 0%, ${tier.color}dd 100%)` : tier.color,
                      boxShadow: tier.cartoony ? `0 0 8px ${tier.color}80` : undefined,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${light ? "bg-[#F8FAFC]" : ""}`} style={!light ? { background: SURFACE } : undefined}>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            {isTeacherFlow ? (
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
            <span className={`text-2xl font-extrabold ${light ? "text-[#0F172A]" : "text-white"}`}>
              Lexicon<span style={{ color: BLUE }}>League</span>
            </span>
          </div>

          {gateMessage && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-bold" style={{ background: `${BLUE}15`, border: `1px solid ${BLUE}40`, color: BLUE }}>
              {gateMessage}
            </div>
          )}

          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold mb-1 font-display ${light ? "text-[#0F172A]" : "text-white"}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {isTeacherFlow ? "Create teacher account" : "Create your account"}
            </h2>
            <p className={`text-sm font-medium ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>
              Free forever.{" "}
              <Link href={isTeacherFlow ? "/auth/login?next=/teacher" : "/auth/login"} className="font-bold hover:underline" style={{ color: BLUE }}>
                Already have one? Sign in
              </Link>
            </p>
            {!isTeacherFlow && (
              <p className={`text-sm font-medium mt-1 ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>
                Are you a teacher?{" "}
                <Link href="/auth/teacher-signup" className="font-bold hover:underline" style={{ color: BLUE }}>
                  Use teacher signup
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
                <span className="flex-1 text-center">Sign up with Google</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: light ? "#E2E8F0" : "rgba(255,255,255,0.1)" }} />
                <span className={`text-xs font-bold ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>or</span>
                <div className="flex-1 h-px" style={{ background: light ? "#E2E8F0" : "rgba(255,255,255,0.1)" }} />
              </div>

              <button
                onClick={() => setView("email")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-bold text-sm ${btnSecondary}`}
              >
                <MailIcon className={`w-5 h-5 shrink-0 ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`} />
                <span className="flex-1 text-center">Sign up with Email</span>
              </button>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                  {error}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              {!isTeacherFlow && (
                <button
                  type="button"
                  onClick={() => { setView("providers"); setError(""); }}
                  className={`flex items-center gap-1.5 text-sm font-semibold mb-2 transition-colors ${light ? "text-[#64748B] hover:text-[#0F172A]" : "text-[#94A3B8] hover:text-white"}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                  </svg>
                  All sign-up options
                </button>
              )}
              {isTeacherFlow && (
                <p className={`text-xs ${light ? "text-[#64748B]" : "text-[#94A3B8]"} mb-2`}>
                  Student? <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: BLUE }}>Sign up as student</Link>
                </p>
              )}

              <div className="space-y-1.5">
                <label className={`block text-sm font-bold ${light ? "text-[#0F172A]" : "text-white"}`}>Username <span className={`font-semibold ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>(your display name)</span></label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. WordNinja99"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-sm font-bold ${light ? "text-[#0F172A]" : "text-white"}`}>Grade <span className={`font-semibold ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>(optional)</span></label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors appearance-none ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A]" : "text-white"}`}
                >
                  <option value="">Select your grade</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={`block text-sm font-bold ${light ? "text-[#0F172A]" : "text-white"}`}>Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-sm font-bold ${light ? "text-[#0F172A]" : "text-white"}`}>Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors ${inputBg} ${inputBorder} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-sm font-bold ${light ? "text-[#0F172A]" : "text-white"}`}>Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium transition-colors ${inputBg} ${inputFocus} ${light ? "text-[#0F172A] placeholder-[#64748B]" : "text-white placeholder-[#94A3B8]"} ${
                    confirm && confirm !== password ? "border-red-400" : inputBorder
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-red-500 text-xs font-semibold mt-1">Passwords don&apos;t match</p>
                )}
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
                {isPending ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          <p className={`mt-6 text-center text-xs font-medium ${light ? "text-[#64748B]" : "text-[#94A3B8]"}`}>
            By continuing, you agree to our{" "}
            <Link href="/legal/terms" className="underline hover:opacity-80">
              Terms
            </Link>
            {" "}and{" "}
            <Link href="/legal/privacy" className="underline hover:opacity-80">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
