"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";

const AMBER = "#F59E0B";

export interface TeacherLayoutProps {
  children: React.ReactNode;
  /** Back link destination (default: /) */
  backHref?: string;
  /** Back link label (default: "Home") */
  backLabel?: string;
  /** Optional right-side nav links (e.g. "Teacher home", "All classes") */
  navLinks?: { href: string; label: string }[];
  /** Optional title and subtitle */
  title?: string;
  subtitle?: string;
}

export default function TeacherLayout({
  children,
  backHref = "/",
  backLabel = "Home",
  navLinks = [],
  title,
  subtitle,
}: TeacherLayoutProps) {
  const { light } = useTheme();
  const bg = light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";

  return (
    <main className={`min-h-screen px-6 py-10 ${bg} relative overflow-hidden`}>
      {/* Ambient background */}
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

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3">
          <Link
            href={backHref}
            className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors flex items-center gap-1.5`}
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
          <div className="flex items-center gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold ${textMuted} hover:text-amber-500 transition-colors`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}40` }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Teacher Portal
            </span>
          </div>
        </div>

        <div className="mb-6">
          {title && (
            <h1 className={`text-3xl sm:text-4xl font-extrabold ${text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {title}
            </h1>
          )}
          {subtitle && <p className={`text-sm mt-1 ${textMuted}`}>{subtitle}</p>}
        </div>

        {children}
      </div>
    </main>
  );
}

export const teacherCardClass = (light: boolean) =>
  light ? "bg-white border-amber-200/50 shadow-xl shadow-amber-500/5" : "bg-[#131922] border-amber-500/20";

export const teacherCardBorder = "rounded-2xl border-2";
