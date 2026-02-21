"use client";

export const dynamic = "force-dynamic";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInWithUsernameOrEmail } from "@/app/auth/actions";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleIcon from "@/components/icons/GoogleIcon";
import LogoIcon from "@/components/icons/LogoIcon";
import MailIcon from "@/components/icons/MailIcon";

type View = "providers" | "email";

export default function LoginPage() {
  const router = useRouter();
  const { light } = useTheme();
  const [view, setView] = useState<View>("providers");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signInWithUsernameOrEmail(usernameOrEmail, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden bg-[#3B82F6]">
        {/* Soft shapes */}
        <div className="absolute top-20 left-16 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute bottom-24 right-12 w-56 h-56 rounded-full bg-[#60A5FA]/30" />
        <div className="absolute top-1/2 left-12 w-24 h-24 rounded-full bg-[#34D399]/20" />

        <div className="relative z-10 text-center px-12 space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-xl overflow-hidden p-1">
              <LogoIcon className="w-full h-full" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Lexicon
              <br />
              <span className="text-[#34D399]">League</span>
            </h1>
            <p className="text-white/90 text-lg mt-4 font-semibold">
              Words are your superpower.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-left">
            {[
              { text: "Climb from Bronze to Emerald", color: "#34D399" },
              { text: "60-second vocab sprints", color: "#60A5FA" },
              { text: "Beat your personal best", color: "#6EE7B7" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-white font-semibold text-sm">{item.text}</span>
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

          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold mb-1 ${light ? "text-[#0F172A]" : "text-white"}`}>
              Welcome back!
            </h2>
            <p className={`text-sm font-medium ${light ? "text-[#64748B]" : "text-white/60"}`}>
              Sign in to continue your journey.{" "}
              <Link href="/auth/signup" className="font-bold text-[#3B82F6] hover:underline">
                New here? Join free
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
                <span className="flex-1 text-center">Continue with Google</span>
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
                <span className="flex-1 text-center">Continue with Email</span>
              </button>

              {error && (
                <div className="mt-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <button
                type="button"
                onClick={() => { setView("providers"); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] font-semibold mb-4 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                All sign-in options
              </button>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Username or email</label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="username or you@example.com"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white placeholder-[#64748B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0F172A]">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none text-[#0F172A] text-sm font-medium transition-colors bg-white placeholder-[#64748B]"
                />
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
                {isPending ? "Signing in…" : "Sign In"}
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
