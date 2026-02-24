"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  completeHomeschoolTeacherOnboarding,
  completePublicTeacherOnboarding,
  searchSchools,
} from "@/lib/supabase/teacher-portal";
import { School } from "@/types";

const AMBER = "#F59E0B";
const AMBER_DARK = "#D97706";
const GOLD = "#FBBF24";

const GRADE_OPTIONS = [
  "Pre-K", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
  "Multiple grades", "Other",
];

const SUBJECT_OPTIONS = [
  "ELA / English", "Reading", "Writing", "Vocabulary", "Grammar",
  "Social Studies", "History", "Science", "Math", "Other",
];

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { light } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [teacherType, setTeacherType] = useState<"homeschool" | "public" | null>(null);

  // Public school fields
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolResults, setSchoolResults] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [searching, setSearching] = useState(false);

  // Shared fields
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?next=/teacher/onboarding");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let cancelled = false;
    const query = schoolQuery.trim();
    if (query.length < 2 || selectedSchool?.name === query) {
      setSchoolResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const result = await searchSchools(query, 8);
      if (cancelled) return;
      setSearching(false);
      setSchoolResults(result.success ? result.rows : []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [schoolQuery, selectedSchool]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    if (teacherType === "homeschool") {
      const res = await completeHomeschoolTeacherOnboarding(grade, subject);
      setSubmitting(false);
      if (!res.success) {
        setError(res.error ?? "Could not complete onboarding");
        return;
      }
      router.replace("/teacher/hub");
      return;
    }

    if (teacherType === "public" && selectedSchool) {
      if (!schoolEmail.includes("@")) {
        setError("Enter a valid school email.");
        setSubmitting(false);
        return;
      }
      const res = await completePublicTeacherOnboarding(
        selectedSchool.id,
        schoolEmail,
        grade || undefined,
        subject || undefined
      );
      setSubmitting(false);
      if (!res.success) {
        setError(res.error ?? "Could not complete onboarding");
        return;
      }
      router.replace(res.teacherApproved ? "/teacher/hub" : "/teacher?pending=1");
      return;
    }

    setSubmitting(false);
    setError("Select a school from the lookup results.");
  }

  if (loading || !user) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]"}`}>
        <div className="animate-pulse text-amber-500 font-semibold">Loading…</div>
      </main>
    );
  }

  const bg = light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]";
  const card = light ? "bg-white shadow-xl shadow-amber-500/5 border-amber-200/50" : "bg-[#131922] border-amber-500/20";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const input = light
    ? "bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-400 focus:ring-amber-400/20"
    : "bg-[#0F172A] border-slate-600/60 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/20";

  return (
    <main className={`min-h-screen px-6 py-10 ${bg} relative overflow-hidden`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${light ? "#0F172A" : "#fff"} 1px, transparent 1px),
              linear-gradient(90deg, ${light ? "#0F172A" : "#fff"} 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${light ? "bg-amber-200/30" : "bg-amber-500/10"}`} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/teacher"
            className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors flex items-center gap-1.5`}
          >
            <span aria-hidden>←</span> Back to Teacher
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}40` }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            Teacher Setup
          </span>
        </div>

        <div className={`rounded-3xl border-2 p-8 sm:p-10 ${card}`}>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold ${text}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {step === 1 ? "What type of educator are you?" : "Tell us about your teaching context"}
          </h1>
          <p className={`text-sm mt-2 ${textMuted}`}>
            {step === 1
              ? "This helps us tailor the teacher portal for you."
              : teacherType === "homeschool"
                ? "A few details to personalize your experience."
                : "We'll verify your school email to unlock the full portal."}
          </p>

          {step === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <button
                type="button"
                onClick={() => {
                  setTeacherType("homeschool");
                  setStep(2);
                }}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  teacherType === "homeschool"
                    ? "border-amber-500 bg-amber-500/10"
                    : light
                      ? "border-[#E2E8F0] hover:border-amber-300 hover:bg-amber-50/50"
                      : "border-slate-600/60 hover:border-amber-500/40 hover:bg-amber-500/5"
                }`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${AMBER}20` }}>
                  <svg className="w-6 h-6" style={{ color: AMBER }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                </div>
                <p className={`font-bold ${text}`}>Homeschool</p>
                <p className={`text-sm mt-1 ${textMuted}`}>Teaching at home or in a homeschool co-op</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherType("public");
                  setStep(2);
                }}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  teacherType === "public"
                    ? "border-amber-500 bg-amber-500/10"
                    : light
                      ? "border-[#E2E8F0] hover:border-amber-300 hover:bg-amber-50/50"
                      : "border-slate-600/60 hover:border-amber-500/40 hover:bg-amber-500/5"
                }`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${AMBER}20` }}>
                  <svg className="w-6 h-6" style={{ color: AMBER }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L12 3zm0 2.18l4.82 2.68L12 10.72 7.18 8 12 5.28z" />
                  </svg>
                </div>
                <p className={`font-bold ${text}`}>Public / Private School</p>
                <p className={`text-sm mt-1 ${textMuted}`}>Teaching at a K–12 school or district</p>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 mt-8">
              {teacherType === "public" && (
                <>
                  <div className="relative space-y-2">
                    <label className={`block text-sm font-bold ${text}`}>School</label>
                    <input
                      value={schoolQuery}
                      onChange={(e) => {
                        setSchoolQuery(e.target.value);
                        setSelectedSchool(null);
                      }}
                      required
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${input}`}
                      placeholder="Search by school name, city, or state"
                    />
                    {searching && <p className={`text-xs ${textMuted}`}>Searching…</p>}
                    {!searching && schoolResults.length > 0 && !selectedSchool && (
                      <div className={`absolute z-20 mt-1 w-full rounded-xl border-2 overflow-hidden shadow-xl ${card}`}>
                        {schoolResults.map((school) => (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => {
                              setSelectedSchool(school);
                              setSchoolQuery(`${school.name}${school.city ? `, ${school.city}` : ""}`);
                              setSchoolResults([]);
                            }}
                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${light ? "border-amber-100 hover:bg-amber-50" : "border-slate-700/50 hover:bg-amber-500/10"}`}
                          >
                            <p className={`text-sm font-bold ${text}`}>{school.name}</p>
                            <p className={`text-xs ${textMuted}`}>{[school.city, school.state].filter(Boolean).join(", ")}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSchool && (
                      <p className="text-sm font-medium" style={{ color: AMBER }}>✓ {selectedSchool.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-sm font-bold ${text}`}>School email</label>
                    <input
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      required
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${input}`}
                      placeholder="you@school.edu"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className={`block text-sm font-bold ${text}`}>Grade(s) you teach</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${input}`}
                >
                  <option value="">Select grade</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-bold ${text}`}>Subject area</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${input}`}
                >
                  <option value="">Select subject</option>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold border-2 ${light ? "border-[#E2E8F0] text-[#0F172A]" : "border-slate-600/60 text-white"}`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || (teacherType === "public" && !selectedSchool)}
                  className="flex-1 rounded-xl px-6 py-4 text-base font-bold text-slate-900 disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`,
                    boxShadow: `0 4px 20px ${AMBER}40`,
                  }}
                >
                  {submitting ? "Setting up…" : "Complete setup"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
