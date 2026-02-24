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

export default function TeacherLandingPage({ light }: { light: boolean }) {
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
        }
        @media (max-width: 860px) {
          .teacher-nav-desktop { display: none !important; }
          .teacher-hamburger { display: flex !important; }
        }
        @media (max-width: 640px) {
          .teacher-proof-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .teacher-proof-divider { border-right: none !important; }
          .teacher-curriculum-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .teacher-curriculum-left { text-align: center !important; }
          .teacher-curriculum-right { align-items: center !important; }
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
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: DARK, border: `1.5px solid ${AMBER}55`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "4px" }}>
              <LogoIcon className="w-full h-full" style={{ minWidth: "24px", minHeight: "24px" }} />
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
            <Link
              href="/auth/teacher-signup"
              style={{ padding: "9px 22px", borderRadius: "8px", background: `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 50%, ${AMBER_DARK} 100%)`, color: "#0F172A", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", transition: "opacity 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(245,158,11,0.55)"; e.currentTarget.style.opacity = "0.92"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,158,11,0.4)"; e.currentTarget.style.opacity = "1"; }}
            >
              Sign Up Free
            </Link>
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
            ].map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: mutedColor, fontSize: "0.95rem", fontWeight: 500, textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
            <Link href="/auth/teacher-signup" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", color: AMBER, fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", marginTop: "4px" }}>
              Sign Up Free
            </Link>
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

            <p style={{ fontSize: "1.05rem", color: mutedColor, lineHeight: 1.78, marginBottom: "44px", maxWidth: "480px", fontWeight: 400 }}>
              Create classes, share join codes, and host live vocabulary battles for 20+ students. View reports, export to CSV, and track progress — all free. Homeschool and public school teachers welcome.
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
                href="/auth/teacher-login?next=/teacher"
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
            { Icon: GraduationIcon, title: "Create Your Account", num: "01", desc: "Sign up free with your school email. Choose homeschool or public school, then pick your grade level and subject." },
            { Icon: UsersIcon, title: "Create Classes & Rosters", num: "02", desc: "Create classes and share 6-character join codes. Students request to join; you approve and assign display names." },
            { Icon: ChartIcon, title: "Host & Track", num: "03", desc: "Host live vocabulary battles for 20+ players. View session reports and export to CSV for your gradebook." },
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
              { title: "Classes & Rosters", accent: AMBER, sub: "Manage Your Class", tags: ["Create classes", "Approve join requests", "Assign display names", "CSV import"], desc: "Create classes and manage student rosters. Students request to join with a 6-character code." },
              { title: "Live Sessions", accent: GOLD, sub: "20+ Players", tags: ["Real-time battles", "60-second rounds", "Vocabulary challenges", "Host controls"], desc: "Host live vocabulary battles for your whole class. Students join with a room code." },
              { title: "Reports & Export", accent: AMBER_DARK, sub: "Track Progress", tags: ["Per-session reports", "Participation data", "CSV export", "Gradebook ready"], desc: "View detailed reports after each session. Export to CSV for your gradebook." },
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
        <div className="teacher-curriculum-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div className="teacher-curriculum-left">
            <SLabel align="left">CURRICULUM</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: textColor, marginBottom: "16px", fontFamily: DISPLAY }}>
              Built for Every Grade
            </h2>
            <p style={{ fontSize: "1rem", color: mutedColor, lineHeight: 1.75, marginBottom: "32px" }}>
              Grades 3–12. ELA, vocabulary, language arts. Definitions, synonyms, antonyms, context clues, word parts. 60-second rounds — perfect for classroom engagement.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((t) => (
                <span key={t} style={{ padding: "5px 14px", borderRadius: "100px", border: `1.5px solid ${AMBER}45`, fontSize: "0.78rem", fontWeight: 600, color: AMBER, background: `${AMBER}0D` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="teacher-curriculum-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "20px" }}>
              Skill types covered
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["Definitions", "Synonyms", "Antonyms", "Context Clues", "Word Parts", "Rhetoric", "Inference"].map((skill) => (
                <span key={skill} style={{ padding: "6px 16px", borderRadius: "100px", border: `1px solid ${AMBER}45`, fontSize: "0.83rem", fontWeight: 500, color: AMBER, background: `${AMBER}10` }}>
                  {skill}
                </span>
              ))}
            </div>
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
              href="/auth/teacher-login?next=/teacher"
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
          </div>
        </div>
      </footer>
    </div>
  );
}
