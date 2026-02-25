"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LogoIcon from "@/components/icons/LogoIcon";
import InkAvatar from "@/components/InkAvatar";
import ThemeToggle from "@/components/ThemeToggle";

// ── Teacher design tokens ─────────────────────────────────────────────────────
const AMBER = "#F59E0B";
const GOLD = "#FBBF24";
const AMBER_DARK = "#D97706";
const DARK = "#0F172A";
const CARD = "#1E293B";
const SURFACE = "#0A0804";
const MUTED = "#94A3B8";
const FAINT = "#64748B";

const DISPLAY = "'Playfair Display', Georgia, serif";
const BODY = "'Outfit', system-ui, sans-serif";

const FLOAT_WORDS = [
  "vocabulary", "classroom", "roster", "reports", "curriculum",
  "grades", "sessions", "export", "join codes", "ELA",
];

const AP_CURRICULUM_STRANDS = [
  {
    title: "Word Meaning in Context",
    summary: "Students determine precise meaning from syntax, tone, and rhetorical context.",
    skills: ["Context clues and diction shifts", "Denotation vs connotation", "Academic and discipline-specific terms"],
  },
  {
    title: "Rhetorical Analysis",
    summary: "Students analyze how language choices shape purpose, audience, and argument.",
    skills: ["Tone, style, and rhetorical situation", "Appeals and line of reasoning", "Syntax and sentence-level effects"],
  },
  {
    title: "Evidence and Argument",
    summary: "Students use vocabulary in claims, counterclaims, and evidence-based writing.",
    skills: ["Claim precision and qualifiers", "Evidence integration and commentary", "Transitions and logical cohesion"],
  },
  {
    title: "Revision and Style",
    summary: "Students revise for clarity, concision, and impact in AP-style writing tasks.",
    skills: ["Word economy and precision", "Sentence variety and control", "Figurative language and voice"],
  },
];

const AP_CURRICULUM_PROGRESSION = [
  {
    phase: "Phase 1",
    window: "Launch",
    title: "Vocabulary Foundations",
    detail: "Build core Tier 2 vocabulary, morphology routines, and context-clue habits for daily retrieval.",
  },
  {
    phase: "Phase 2",
    window: "Develop",
    title: "Analysis and Interpretation",
    detail: "Move from recall to interpretation by analyzing tone, nuance, and rhetorical impact in short passages.",
  },
  {
    phase: "Phase 3",
    window: "Apply",
    title: "Argument and Reasoning",
    detail: "Apply academic vocabulary to claim-driven responses, evidence commentary, and argument structure.",
  },
  {
    phase: "Phase 4",
    window: "Refine",
    title: "AP-Style Revision",
    detail: "Practice revision decisions that improve precision, coherence, and style under timed conditions.",
  },
];

const AP_CURRICULUM_CYCLE = [
  { step: "Diagnose", detail: "Use warm-up rounds to surface gaps in vocabulary knowledge and transfer skills." },
  { step: "Teach", detail: "Target the highest-leverage strand with mini-lessons and modeled examples." },
  { step: "Practice", detail: "Run short, mixed-skill rounds for repetition, feedback, and engagement." },
  { step: "Measure", detail: "Review session reports and export data to plan reteach groups or writing support." },
];

function ArrowRight({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SLabel({ children, align = "center" }: { children: React.ReactNode; align?: "left" | "center" }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "16px",
      justifyContent: align === "center" ? "center" : "flex-start",
    }}>
      {align === "center" && (
        <span style={{ width: "28px", height: "1px", background: `${AMBER}55`, flexShrink: 0 }} />
      )}
      <p style={{
        letterSpacing: "0.2em",
        fontSize: "0.63rem",
        color: AMBER,
        textTransform: "uppercase",
        fontWeight: 700,
        margin: 0,
        fontFamily: BODY,
      }}>
        {children}
      </p>
      <span style={{ width: "28px", height: "1px", background: `${AMBER}55`, flexShrink: 0 }} />
    </div>
  );
}

function GraduationIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function UsersIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChartIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export default function TeacherLandingPage({ light, teacherMode = false }: { light: boolean; teacherMode?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const bgSurface = light ? "#FAFAF9" : SURFACE;
  const cardBg = light ? "#FFFFFF" : CARD;
  const cardBorder = light ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)";
  const textColor = light ? "#0F172A" : "white";
  const mutedColor = light ? "#64748B" : MUTED;

  return (
    <div style={{ background: bgSurface, color: textColor, overflowX: "hidden", fontFamily: BODY }}>
      <style>{`
        html { scroll-behavior: smooth; }
        .teacher-float-word {
          position: absolute;
          pointer-events: none;
          font-weight: 700;
          font-size: var(--fs, 1rem);
          color: rgba(245,158,11,0.4);
          animation: teacherFloatUp var(--dur, 18s) var(--delay, 0s) linear infinite;
          user-select: none;
          white-space: nowrap;
          font-family: 'Playfair Display', serif;
          font-style: italic;
        }
        @keyframes teacherFloatUp {
          0%   { transform: translateY(0) rotate(var(--rot)); opacity: 0; }
          8%   { opacity: 0.5; }
          92%  { opacity: 0.5; }
          100% { transform: translateY(-110vh) rotate(var(--rot)); opacity: 0; }
        }
        .teacher-nav-link { position: relative; }
        .teacher-nav-link::after {
          content: '';
          position: absolute;
          bottom: -3px; left: 0;
          width: 0; height: 1px;
          background: ${AMBER};
          transition: width 0.25s ease;
        }
        .teacher-nav-link:hover::after { width: 100%; }
        .teacher-mode-card { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; }
        .teacher-mode-card:hover { transform: translateY(-6px); }
        @media (max-width: 900px) {
          .teacher-hero-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .teacher-hero-ctas { justify-content: center !important; }
          .teacher-modes-grid { grid-template-columns: 1fr !important; }
          .teacher-testimonials { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 860px) {
          .teacher-nav-desktop { display: none !important; }
          .teacher-hamburger { display: flex !important; }
        }
        @media (max-width: 640px) {
          .teacher-proof-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .teacher-proof-divider { border-right: none !important; }
          .teacher-curriculum-grid { grid-template-columns: 1fr !important; text-align: left !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: scrolled ? "1px solid rgba(245,158,11,0.12)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        background: scrolled ? (light ? "rgba(250,250,249,0.94)" : "rgba(10,8,4,0.94)") : "transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: DARK, border: `1.5px solid ${AMBER}55`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "2px" }}>
              <InkAvatar config={{ base: "droplet_01", color: AMBER, eyes: "eyes_03", accessory: "quill_01", aura: "none" }} size={32} />
            </div>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: textColor, whiteSpace: "nowrap", fontFamily: BODY }}>
              Lexicon<span style={{ color: AMBER }}>League</span>
            </span>
          </Link>

          <div style={{ display: "flex", gap: "32px", alignItems: "center", flex: 1, justifyContent: "center" }} className="teacher-nav-desktop">
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Tools", href: "#tools" },
              { label: "Curriculum", href: "#curriculum" },
              { label: "Reports", href: "#reports" },
              { label: "FAQ", href: "#faq" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="teacher-nav-link"
                style={{ fontSize: "0.84rem", fontWeight: 500, color: mutedColor, textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = mutedColor)}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
            <ThemeToggle />
            <Link
              href="/"
              style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${light ? "rgba(15,23,42,0.2)" : "rgba(255,255,255,0.13)"}`, color: mutedColor, fontSize: "0.84rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = AMBER; e.currentTarget.style.color = textColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = light ? "rgba(15,23,42,0.2)" : "rgba(255,255,255,0.13)"; e.currentTarget.style.color = mutedColor; }}
            >
              For Students
            </Link>
            {teacherMode ? (
              <Link
                href="/teacher/hub"
                style={{ padding: "9px 22px", borderRadius: "8px", background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`, color: "#0F172A", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", transition: "opacity 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(245,158,11,0.55)"; e.currentTarget.style.opacity = "0.92"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,158,11,0.4)"; e.currentTarget.style.opacity = "1"; }}
              >
                Go to Portal
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/teacher-login?next=/teacher/hub"
                  style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${AMBER}55`, color: AMBER, fontSize: "0.84rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${AMBER}18`; e.currentTarget.style.color = textColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = AMBER; }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/teacher-signup"
              style={{ padding: "9px 22px", borderRadius: "8px", background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`, color: "#0F172A", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", transition: "opacity 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(245,158,11,0.55)"; e.currentTarget.style.opacity = "0.92"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,158,11,0.4)"; e.currentTarget.style.opacity = "1"; }}
            >
              Sign Up Free
            </Link>
              </>
            )}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="teacher-hamburger"
              style={{ background: "none", border: "none", color: textColor, cursor: "pointer", padding: "4px", display: "none", flexShrink: 0 }}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ background: cardBg, borderTop: `1px solid ${cardBorder}`, padding: "8px 28px 24px" }}>
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Tools", href: "#tools" },
              { label: "Curriculum", href: "#curriculum" },
              { label: "Reports", href: "#reports" },
              { label: "FAQ", href: "#faq" },
            ].map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: mutedColor, fontSize: "0.95rem", fontWeight: 500, textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
            {teacherMode ? (
              <Link href="/teacher/hub" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", color: AMBER, fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", marginTop: "4px" }}>
                Go to Portal
              </Link>
            ) : (
              <>
                <Link href="/auth/teacher-login?next=/teacher/hub" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", color: mutedColor, fontSize: "0.95rem", fontWeight: 500, textDecoration: "none" }}>
                  Sign In
                </Link>
                <Link href="/auth/teacher-signup" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", color: AMBER, fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", marginTop: "4px" }}>
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" style={{ position: "relative", minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", padding: "100px 24px 120px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {FLOAT_WORDS.map((word, i) => (
            <span
              key={word}
              className="teacher-float-word"
              style={{
                left: `${(i * 6.1 + 4) % 92}%`,
                bottom: "-5%",
                "--rot": `${(i * 13 - 25) % 36}deg`,
                "--dur": `${15 + (i * 2.8) % 12}s`,
                "--delay": `${(i * 1.7) % 12}s`,
                "--fs": `${0.95 + (i * 0.12) % 0.6}rem`,
              } as React.CSSProperties}
            >
              {word}
            </span>
          ))}
        </div>

        <div style={{ position: "absolute", top: "50%", right: "6%", transform: "translateY(-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "440px", height: "440px", borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

        <div
          className="teacher-hero-grid"
          style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "center" }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: DARK, border: `2px solid ${AMBER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationIcon className="w-6 h-6" color={AMBER} />
              </div>
              <div>
                <p style={{ fontSize: "0.62rem", fontWeight: 700, color: AMBER, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2px", fontFamily: BODY }}>Teacher Portal</p>
                <p style={{ fontSize: "0.83rem", fontWeight: 400, color: mutedColor, lineHeight: 1.2, fontFamily: BODY }}>Vocabulary in class. 60 seconds. Free.</p>
              </div>
            </div>

            <h1 style={{ marginBottom: "28px", lineHeight: 1 }}>
              <span style={{ display: "block", fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 900, fontSize: "clamp(3.2rem, 8vw, 5.6rem)", color: AMBER, lineHeight: 0.92, letterSpacing: "-0.02em" }}>
                Vocabulary
              </span>
              <span style={{ display: "block", fontFamily: BODY, fontWeight: 300, fontSize: "clamp(1.4rem, 3.2vw, 2.1rem)", color: light ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.45)", letterSpacing: "0.01em", margin: "10px 0 6px" }}>
                in your
              </span>
              <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(2.6rem, 6.5vw, 4.6rem)", color: textColor, lineHeight: 1, letterSpacing: "-0.02em" }}>
                classroom.
              </span>
            </h1>

            <p style={{ fontSize: "1.05rem", color: mutedColor, lineHeight: 1.78, marginBottom: "24px", maxWidth: "480px", fontWeight: 400 }}>
              Create classes, share join codes, and host live vocabulary battles for 20+ students. View reports, export to CSV, and track progress — all free. Homeschool and public school teachers welcome.
            </p>
            <p style={{ fontSize: "0.9rem", color: FAINT, lineHeight: 1.65, marginBottom: "44px", maxWidth: "480px", fontWeight: 400 }}>
              Students join with a room code. No account required for them — they can play as guests. You set a teacher access code to lock reports and export. Perfect for warm-ups, review, or end-of-unit vocabulary practice.
            </p>

            <div className="teacher-hero-ctas" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href="/auth/teacher-signup"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 38px", borderRadius: "10px", background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`, color: "#0F172A", fontSize: "1rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 24px rgba(245,158,11,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(245,158,11,0.55)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.4)"; }}
              >
                Sign Up for Teachers
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/auth/teacher-login?next=/teacher/hub"
                style={{ display: "inline-flex", alignItems: "center", padding: "15px 28px", borderRadius: "10px", border: `2px solid ${AMBER}55`, color: AMBER, fontSize: "1rem", fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${AMBER}18`; e.currentTarget.style.color = textColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = AMBER; }}
              >
                Sign In
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%", border: "1px dashed rgba(245,158,11,0.25)", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)" }} />
              <InkAvatar config={{ base: "droplet_01", color: AMBER, eyes: "eyes_03", accessory: "quill_01", aura: "aura_glow_01" }} size={180} />
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div style={{ background: cardBg, borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}` }}>
        <div className="teacher-proof-grid" style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { value: "20+", label: "Students per Session" },
            { value: "3–12", label: "Grade Levels" },
            { value: "60s", label: "Round Length" },
            { value: "CSV", label: "Export Ready" },
            { value: "Free", label: "Forever" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={i < 4 ? "teacher-proof-divider" : ""}
              style={{ textAlign: "center", padding: "36px 16px", borderRight: i < 4 ? `1px solid ${cardBorder}` : "none" }}
            >
              <p style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 700, color: AMBER, marginBottom: "6px", fontFamily: DISPLAY, fontStyle: "italic" }}>{stat.value}</p>
              <p style={{ fontSize: "0.78rem", color: mutedColor, fontWeight: 500, letterSpacing: "0.03em" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <SLabel>GET STARTED</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: textColor, fontFamily: DISPLAY }}>
            Simple Setup. Real Results.
          </h2>
        </div>

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
          <div style={{ position: "absolute", top: "36px", left: "calc(16.67% + 16px)", right: "calc(16.67% + 16px)", height: "1px", background: `linear-gradient(90deg, ${AMBER}15, ${AMBER}55, ${AMBER}15)`, zIndex: 0 }} />

          {[
            { Icon: GraduationIcon, title: "Create Your Account", num: "01", desc: "Sign up free with your school email. Choose homeschool or public school, then pick your grade level and subject. Public school teachers may need verification (typically 24–48 hours). Homeschool teachers are approved instantly." },
            { Icon: UsersIcon, title: "Create Classes & Rosters", num: "02", desc: "Create classes and share 6-character join codes. Students request to join; you approve and assign display names. Import rosters via CSV or add students manually. Each class gets its own code." },
            { Icon: ChartIcon, title: "Host & Track", num: "03", desc: "Create a classroom room, set a teacher access code (4+ chars), and share the room code with students. Host live 60-second vocabulary rounds. After each session, view reports and export to CSV for your gradebook." },
          ].map((step) => {
            const Icon = step.Icon;
            return (
              <div key={step.num} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "7rem", fontWeight: 900, fontFamily: DISPLAY, color: `${AMBER}08`, lineHeight: 1, userSelect: "none", pointerEvents: "none", letterSpacing: "-0.05em", whiteSpace: "nowrap" }}>
                  {step.num}
                </div>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: cardBg, border: `1.5px solid ${AMBER}60`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", position: "relative" }}>
                  <Icon className="w-7 h-7" color={AMBER} />
                  <span style={{ position: "absolute", bottom: "-8px", right: "-8px", background: AMBER, color: DARK, fontSize: "0.55rem", fontWeight: 900, borderRadius: "100px", padding: "2px 7px", fontFamily: BODY }}>
                    {step.num}
                  </span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textColor, marginBottom: "10px", fontFamily: BODY }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: mutedColor, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: "56px", fontSize: "0.85rem", color: FAINT, fontStyle: "italic" }}>
          No subscription. No credit card. Teachers use a separate login — your student account won&apos;t auto-switch.
        </p>
      </section>

      {/* TOOLS (like game modes) */}
      <section id="tools" style={{ background: light ? "#F5F5F4" : DARK, padding: "110px 24px", borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}` }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SLabel>TOOLS</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: textColor, fontFamily: DISPLAY }}>
              Everything You Need
            </h2>
          </div>

          <div className="teacher-modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { title: "Classes & Rosters", accent: AMBER, sub: "Manage Your Class", tags: ["Create classes", "Approve join requests", "Assign display names", "CSV import"], desc: "Create classes and manage student rosters. Students request to join with a 6-character code. Approve requests and assign display names for gradebook. Import rosters from CSV for bulk setup." },
              { title: "Join Codes & Room Codes", accent: GOLD, sub: "Easy Student Access", tags: ["6-char class codes", "6-char room codes", "Teacher access code", "No student login"], desc: "Share a 6-character class code so students can request to join your roster. For live sessions, create a room and share a 6-character room code. Students join as guests — no account required. You set a teacher access code to protect reports." },
              { title: "Live Sessions", accent: AMBER_DARK, sub: "20+ Players", tags: ["Real-time battles", "60-second rounds", "Vocabulary challenges", "Host controls"], desc: "Host live vocabulary battles for your whole class. Students join with the room code. You control when rounds start. Each round is 60 seconds. Supports 20+ players per session. Perfect for warm-ups, review, or end-of-unit practice." },
              { title: "Reports & Export", accent: AMBER, sub: "Track Progress", tags: ["Per-session reports", "Participation data", "CSV export", "Gradebook ready"], desc: "View detailed reports after each session: who participated, how long they played, and performance. Export to CSV for your gradebook. Reports are protected by your teacher access code." },
            ].map((mode) => (
              <div
                key={mode.title}
                className="teacher-mode-card"
                style={{ background: cardBg, borderRadius: "16px", overflow: "hidden", border: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 20px 56px ${mode.accent}25`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ position: "relative", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(180deg, ${mode.accent}18 0%, ${mode.accent}05 100%)`, borderBottom: `1px solid ${mode.accent}18` }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: mode.accent }} />
                  <GraduationIcon className="w-14 h-14" color={mode.accent} />
                </div>
                <div style={{ padding: "22px 22px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textColor, marginBottom: "4px" }}>{mode.title}</h3>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, color: mode.accent, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{mode.sub}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "16px" }}>
                    {mode.tags.map((tag) => (
                      <span key={tag} style={{ padding: "3px 9px", borderRadius: "100px", border: `1px solid ${mode.accent}28`, fontSize: "0.7rem", fontWeight: 500, color: mutedColor, background: `${mode.accent}08` }}>{tag}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.875rem", color: mutedColor, lineHeight: 1.68, flex: 1 }}>{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section id="curriculum" style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SLabel>CURRICULUM</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: textColor, marginBottom: "16px", fontFamily: DISPLAY }}>
            AP-Aligned Vocabulary Framework
          </h2>
          <p style={{ fontSize: "1rem", color: mutedColor, lineHeight: 1.75, maxWidth: "640px", margin: "0 auto" }}>
            Structured around AP English Language and AP English Literature skill expectations, with a clear progression from vocabulary foundations to analytical writing and revision.
          </p>
        </div>

        <div className="teacher-curriculum-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "28px", alignItems: "start" }}>
          <div className="teacher-curriculum-left" style={{ display: "grid", gap: "20px" }}>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px" }}>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>
                AP-aligned competency strands
              </p>
              <div style={{ display: "grid", gap: "14px" }}>
                {AP_CURRICULUM_STRANDS.map((strand) => (
                  <article key={strand.title} style={{ border: `1px solid ${AMBER}24`, borderRadius: "12px", padding: "14px 14px 12px", background: `${AMBER}08` }}>
                    <h3 style={{ fontSize: "0.94rem", fontWeight: 700, color: textColor, marginBottom: "6px" }}>{strand.title}</h3>
                    <p style={{ fontSize: "0.82rem", color: mutedColor, lineHeight: 1.6, marginBottom: "8px" }}>{strand.summary}</p>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "4px" }}>
                      {strand.skills.map((skill) => (
                        <li key={skill} style={{ fontSize: "0.76rem", color: mutedColor, lineHeight: 1.45, paddingLeft: "14px", position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, top: "0.5em", width: "6px", height: "1px", background: `${AMBER}80` }} />
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px" }}>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>
                Yearlong progression map
              </p>
              <div style={{ display: "grid", gap: "10px" }}>
                {AP_CURRICULUM_PROGRESSION.map((phase) => (
                  <div key={phase.phase} style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: "12px", alignItems: "start" }}>
                    <div style={{ borderRadius: "10px", border: `1px solid ${AMBER}35`, background: `${AMBER}10`, padding: "8px 10px" }}>
                      <p style={{ fontSize: "0.68rem", fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{phase.phase}</p>
                      <p style={{ fontSize: "0.74rem", color: mutedColor, margin: 0 }}>{phase.window}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.84rem", fontWeight: 600, color: textColor, margin: "0 0 4px" }}>{phase.title}</p>
                      <p style={{ fontSize: "0.8rem", color: mutedColor, lineHeight: 1.55, margin: 0 }}>{phase.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="teacher-curriculum-right" style={{ display: "grid", gap: "20px", alignContent: "start" }}>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px" }}>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}>
                Instructional cycle
              </p>
              <p style={{ fontSize: "0.87rem", color: mutedColor, lineHeight: 1.65, marginBottom: "16px" }}>
                Run AP-aligned vocabulary instruction as a repeatable cycle that connects gameplay, direct teaching, and measurable growth.
              </p>
              <div style={{ display: "grid", gap: "10px" }}>
                {AP_CURRICULUM_CYCLE.map((item, index) => (
                  <div key={item.step} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${AMBER}50`, background: `${AMBER}12`, color: AMBER, fontSize: "0.74rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {index + 1}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.83rem", fontWeight: 700, color: textColor, margin: "2px 0 4px" }}>{item.step}</p>
                      <p style={{ fontSize: "0.79rem", color: mutedColor, lineHeight: 1.55, margin: 0 }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: `linear-gradient(160deg, ${AMBER}12 0%, transparent 75%)`, border: `1px solid ${AMBER}35`, borderRadius: "16px", padding: "20px 22px" }}>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>
                Built for mixed readiness
              </p>
              <p style={{ fontSize: "0.84rem", color: mutedColor, lineHeight: 1.6, margin: 0 }}>
                Teachers choose grade band and subject once during setup. Lexicon League then calibrates question complexity so support-level and advanced learners can practice the same core skills at an appropriate level.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REPORTS DEEP-DIVE */}
      <section id="reports" style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SLabel>SESSION REPORTS</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: textColor, fontFamily: DISPLAY }}>
            See What You Need
          </h2>
          <p style={{ fontSize: "1rem", color: mutedColor, maxWidth: "560px", margin: "0 auto", lineHeight: 1.75 }}>
            After each classroom session, you get a detailed report. Export to CSV for your gradebook or LMS.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {[
            { title: "Participation", items: ["Who joined the session", "How long each student played", "Number of rounds completed"] },
            { title: "Performance", items: ["Correct vs incorrect answers", "Per-round breakdown", "Session-level summary"] },
            { title: "Export", items: ["CSV download for gradebook", "Compatible with Google Sheets, Excel", "One row per student per session"] },
          ].map((block) => (
            <div key={block.title} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "28px 24px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: AMBER, marginBottom: "16px", fontFamily: BODY }}>{block.title}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {block.items.map((item) => (
                  <li key={item} style={{ fontSize: "0.875rem", color: mutedColor, lineHeight: 1.7, marginBottom: "8px", paddingLeft: "20px", position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: "6px", width: "6px", height: "6px", borderRadius: "50%", background: AMBER }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: light ? "#F5F5F4" : DARK, padding: "110px 24px", borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}` }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SLabel>WHO IT&apos;S FOR</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: textColor, fontFamily: DISPLAY }}>
              Homeschool & Public School
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `4px solid ${AMBER}`, borderRadius: "14px", padding: "32px 28px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textColor, marginBottom: "12px" }}>Homeschool Teachers</h3>
              <p style={{ fontSize: "0.9rem", color: mutedColor, lineHeight: 1.7 }}>
                Approved instantly. No school verification. Create classes, add your students, and host sessions. Great for co-ops or small groups.
              </p>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `4px solid ${GOLD}`, borderRadius: "14px", padding: "32px 28px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textColor, marginBottom: "12px" }}>Public & Private School</h3>
              <p style={{ fontSize: "0.9rem", color: mutedColor, lineHeight: 1.7 }}>
                Sign up with your school email. Verification typically takes 24–48 hours. Once approved, you get full access to classes, rosters, and reports.
              </p>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `4px solid ${AMBER_DARK}`, borderRadius: "14px", padding: "32px 28px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textColor, marginBottom: "12px" }}>Tutors & After-School</h3>
              <p style={{ fontSize: "0.9rem", color: mutedColor, lineHeight: 1.7 }}>
                Use homeschool signup. Create a class for your tutoring group or after-school program. Track progress across sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SLabel>TEACHERS</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: textColor, fontFamily: DISPLAY }}>
            What Teachers Are Saying
          </h2>
        </div>

        <div className="teacher-testimonials" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[
            { quote: "I use Lexicon League for warm-ups and review. The ranked mode keeps my 8th graders engaged and competitive.", name: "Ms. Chen", role: "8th Grade ELA Teacher" },
            { quote: "Students actually ask to play during free time. The 60-second rounds are perfect — quick enough to fit in, substantive enough to matter.", name: "Mr. Torres", role: "6th Grade ELA" },
            { quote: "The CSV export is a lifesaver. I drop it into my gradebook and I'm done. No manual data entry.", name: "Ms. Park", role: "Homeschool Teacher" },
          ].map((t, i) => (
            <div
              key={i}
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: `2px solid ${AMBER}38`, borderRadius: "14px", padding: "32px 26px" }}
            >
              <div style={{ fontFamily: DISPLAY, fontSize: "5.5rem", color: `${AMBER}16`, lineHeight: 0.75, marginBottom: "16px", userSelect: "none", fontWeight: 900 }}>&ldquo;</div>
              <p style={{ fontSize: "0.93rem", color: mutedColor, lineHeight: 1.75, marginBottom: "28px", fontStyle: "italic" }}>{t.quote}</p>
              <div style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: "16px" }}>
                <p style={{ fontSize: "0.88rem", fontWeight: 700, color: textColor, marginBottom: "3px" }}>{t.name}</p>
                <p style={{ fontSize: "0.76rem", color: AMBER, fontWeight: 500, fontStyle: "italic" }}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: light ? "#F5F5F4" : DARK, padding: "110px 24px", borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}` }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SLabel>FAQ</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: textColor, fontFamily: DISPLAY }}>
              Common Questions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { q: "Do students need accounts?", a: "No. Students join with a room code and can play as guests. If they have Lexicon accounts, they can link those too; either way, they can participate." },
              { q: "What's the teacher access code?", a: "A 4+ character code you set when creating a classroom room. It protects reports and CSV export — only you (and anyone you share it with) can view session data." },
              { q: "How long does verification take?", a: "Homeschool teachers are approved instantly. Public school teachers typically get verified within 24–48 hours." },
              { q: "Is there a limit on classes or sessions?", a: "No. Create as many classes as you need. Host as many sessions as you want. Free forever." },
              { q: "Can I use this with Google Classroom?", a: "You can share room codes and join codes via any channel — Google Classroom, email, Canvas, etc. Students just need the code to join." },
            ].map((faq, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "24px 28px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textColor, marginBottom: "10px", fontFamily: BODY }}>{faq.q}</h3>
                <p style={{ fontSize: "0.9rem", color: mutedColor, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: light ? "#FEF3C7" : "linear-gradient(135deg, rgba(180,83,9,0.15) 0%, rgba(15,23,42,0.6) 100%)", padding: "80px 24px", borderTop: `1px solid ${AMBER}30` }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: textColor, marginBottom: "16px", fontFamily: DISPLAY }}>
            Ready to Run Vocabulary in Class?
          </h2>
          <p style={{ fontSize: "1rem", color: mutedColor, lineHeight: 1.75, marginBottom: "32px" }}>
            Sign up free. Create your account, choose your grade and subject, then start hosting. Teachers use a separate login — your student account won&apos;t automatically grant teacher access.
          </p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/auth/teacher-signup"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 38px", borderRadius: "10px", background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`, color: "#0F172A", fontSize: "1rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 24px rgba(245,158,11,0.4)" }}
            >
              Sign Up for Teachers
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/auth/teacher-login?next=/teacher/hub"
              style={{ display: "inline-flex", alignItems: "center", padding: "15px 28px", borderRadius: "10px", border: `2px solid ${AMBER}`, color: AMBER, fontSize: "1rem", fontWeight: 600, textDecoration: "none" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: cardBg, borderTop: `1px solid ${cardBorder}`, padding: "48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "32px", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <LogoIcon className="w-8 h-8" />
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: textColor, fontFamily: BODY }}>
              Lexicon<span style={{ color: AMBER }}>League</span>
            </span>
          </Link>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/" style={{ fontSize: "0.84rem", color: mutedColor, textDecoration: "none" }}>For Students</Link>
            <Link href="/auth/teacher-signup" style={{ fontSize: "0.84rem", color: AMBER, fontWeight: 600, textDecoration: "none" }}>Teacher Sign Up</Link>
            <Link href="/auth/teacher-login" style={{ fontSize: "0.84rem", color: mutedColor, textDecoration: "none" }}>Teacher Sign In</Link>
            <Link href="/legal/privacy" style={{ fontSize: "0.84rem", color: mutedColor, textDecoration: "none" }}>Privacy</Link>
            <Link href="/legal/terms" style={{ fontSize: "0.84rem", color: mutedColor, textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
