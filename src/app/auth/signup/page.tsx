"use client";

export const dynamic = "force-dynamic";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleIcon from "@/components/icons/GoogleIcon";
import LogoIcon from "@/components/icons/LogoIcon";
import MailIcon from "@/components/icons/MailIcon";

type View = "providers" | "email";

const GATE_MESSAGES: Record<string, string> = {
  shop: "Sign up to claim daily Ink Drop rewards and buy cosmetics!",
  locker: "Sign up to customize your Ink Avatar!",
  ranked: "Sign up to compete in Ranked Mode!",
};

const GRADES = ["Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "PSAT", "SAT", "Other"];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("from") ?? "";
  const gateMessage = GATE_MESSAGES[fromPage] ?? "";

  const { light } = useTheme();
  const [view, setView] = useState<View>("providers");
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, grade },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-sm space-y-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-[#ECFDF5] border-2 border-[#22C55E]">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">Check your inbox!</h2>
          <p className="text-[#64748B] text-sm font-medium">{success}</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 rounded-2xl font-bold text-white text-sm bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden bg-[#3B82F6]">
        <div className="absolute top-16 right-24 w-48 h-48 rounded-full bg-[#34D399]/20" />
        <div className="absolute bottom-20 left-16 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute top-1/3 right-8 w-20 h-20 rounded-full bg-[#34D399]/20" />

        <div className="relative z-10 text-center px-12 space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-xl overflow-hidden p-1">
              <LogoIcon className="w-full h-full" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Join the
              <br />
              <span className="text-[#34D399]">League</span>
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

      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${light ? "bg-white" : "bg-[#0F172A]"}`}>
        <div className="w-full max-w-sm">
          <div className="flex justify-end mb-4"><ThemeToggle /></div>
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <LogoIcon className="w-12 h-12" />
            <span className={`text-2xl font-extrabold ${light ? "text-[#0F172A]" : "text-white"}`}>
              Lexicon<span className="text-[#3B82F6]">League</span>
            </span>
          </div>

          {gateMessage && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#DBEAFE] border border-[#3B82F6]/30 text-sm font-bold text-[#3B82F6]">
              {gateMessage}
            </div>
          )}

          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold mb-1 ${light ? "text-[#0F172A]" : "text-white"}`}>
              Create your account
            </h2>
            <p className={`text-sm font-medium ${light ? "text-[#64748B]" : "text-white/60"}`}>
              Free forever.{" "}
              <Link href="/auth/login" className="font-bold text-[#3B82F6] hover:underline">
                Already have one? Sign in
              </Link>
            </p>
          </div>

          {view === "providers" ? (
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#BFDBFE] transition-all font-bold text-[#0F172A] text-sm"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-center">Sign up with Google</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[#64748B] text-xs font-bold">or</span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              <button
                onClick={() => setView("email")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-[#E2E8F0] bg-white hover:border-[#3B82F6] hover:bg-[#F8FAFC] transition-all font-bold text-[#0F172A] text-sm"
              >
                <MailIcon className="w-5 h-5 shrink-0 text-[#64748B]" />
                <span className="flex-1 text-center">Sign up with Email</span>
              </button>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <button
                type="button"
                onClick={() => { setView("providers"); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] font-semibold mb-2 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                All sign-up options
              </button>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Username <span className="text-[#64748B] font-semibold">(your display name)</span></label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. WordNinja99"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white placeholder-[#64748B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Grade <span className="text-[#64748B] font-semibold">(optional)</span></label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white appearance-none"
                >
                  <option value="">Select your grade</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white placeholder-[#64748B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white placeholder-[#64748B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white placeholder-[#64748B] ${
                    confirm && confirm !== password ? "border-red-300 focus:border-red-400" : "border-[#E2E8F0] focus:border-[#3B82F6]"
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-red-500 text-xs font-semibold mt-1">Passwords don&apos;t match</p>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-2xl font-extrabold text-white text-base bg-[#3B82F6] hover:bg-[#2563EB] transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-[#64748B] font-medium">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-[#0F172A]">Terms</span>
            {" "}and{" "}
            <span className="underline cursor-pointer hover:text-[#0F172A]">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
