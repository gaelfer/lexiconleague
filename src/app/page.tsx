"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LogoIcon from "@/components/icons/LogoIcon";
import TrophyIcon from "@/components/icons/TrophyIcon";
import FlameIcon from "@/components/icons/FlameIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import InkDropIcon from "@/components/icons/InkDropIcon";
import InkAvatar from "@/components/InkAvatar";
import { RANK_TIERS, RANK_THRESHOLDS, RANK_COLORS, type RankTier } from "@/types";

// ── Inline icons for marketing ────────────────────────────────────────────────
function UserIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function EyeIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PaletteIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill={color} stroke={color} />
      <circle cx="17.5" cy="10.5" r="0.5" fill={color} stroke={color} />
      <circle cx="8.5" cy="7.5" r="0.5" fill={color} stroke={color} />
      <circle cx="6.5" cy="12.5" r="0.5" fill={color} stroke={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
function CrownIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
function ZapIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CircleIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const MINT    = "#34D399";
const BLUE    = "#3B82F6";
const DARK    = "#0F172A";
const CARD    = "#1E293B";
const SURFACE = "#080F1A";
const MUTED   = "#94A3B8";
const FAINT   = "#475569";

const DISPLAY = "'Playfair Display', Georgia, serif";
const BODY    = "'Outfit', system-ui, sans-serif";

// ── Floating background words for hero ───────────────────────────────────────
const FLOAT_WORDS = [
  "define", "synonym", "rhetoric", "analogy", "context", "lexicon",
  "vocab", "diction", "clauses", "syntax", "prose", "verse", "nuance",
  "allusion", "ethos", "logos",
];

// ── Section eyebrow label ─────────────────────────────────────────────────────
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
        <span style={{ width: "28px", height: "1px", background: `${MINT}55`, flexShrink: 0 }} />
      )}
      <p style={{
        letterSpacing: "0.2em",
        fontSize: "0.63rem",
        color: MINT,
        textTransform: "uppercase",
        fontWeight: 700,
        margin: 0,
        fontFamily: BODY,
      }}>
        {children}
      </p>
      <span style={{ width: "28px", height: "1px", background: `${MINT}55`, flexShrink: 0 }} />
    </div>
  );
}

// ── Arrow icon ────────────────────────────────────────────────────────────────
function ArrowRight({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Page component ────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [showReadyPopup, setShowReadyPopup] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!loading && user) setShowReadyPopup(true);
  }, [loading, user]);

  const playHref = user ? "/dashboard" : "/auth/signup";

  return (
    <div style={{ background: SURFACE, color: "white", overflowX: "hidden", fontFamily: BODY }}>

      {/* ── Ready to play? popup (logged-in users) ── */}
      {showReadyPopup && user && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }}>
          <div style={{
            position: "relative", background: CARD,
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px",
            padding: "44px 52px", maxWidth: "400px", textAlign: "center",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          }}>
            <button onClick={() => setShowReadyPopup(false)} aria-label="Close" style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: MUTED, cursor: "pointer", padding: "4px", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", marginBottom: "12px", fontFamily: DISPLAY }}>Ready to play?</h3>
            <p style={{ fontSize: "0.95rem", color: MUTED, marginBottom: "28px", lineHeight: 1.6 }}>Jump back into the action and keep climbing the ranks.</p>
            <Link href="/dashboard" style={{ display: "inline-block", padding: "14px 36px", borderRadius: "10px", background: BLUE, color: "white", fontSize: "1rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 16px rgba(59,130,246,0.4)" }}>
              Play now
            </Link>
          </div>
        </div>
      )}

      {/* ── Global styles & keyframes ── */}
      <style>{`
        html { scroll-behavior: smooth; box-sizing: border-box; }
        *, *::before, *::after { box-sizing: inherit; margin: 0; padding: 0; }

        @keyframes floatUp {
          0%   { transform: translateY(0) rotate(var(--rot)); opacity: 0; }
          8%   { opacity: 0.48; }
          92%  { opacity: 0.48; }
          100% { transform: translateY(-110vh) rotate(var(--rot)); opacity: 0; }
        }
        .float-word {
          position: absolute;
          pointer-events: none;
          font-weight: 700;
          font-size: var(--fs, 1rem);
          color: rgba(59, 130, 246, 0.55);
          animation: floatUp var(--dur, 18s) var(--delay, 0s) linear infinite;
          user-select: none;
          white-space: nowrap;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          letter-spacing: 0.01em;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ha1 { animation: fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) both; }
        .ha2 { animation: fadeUp 0.75s 0.1s  cubic-bezier(0.22,1,0.36,1) both; }
        .ha3 { animation: fadeUp 0.75s 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .ha4 { animation: fadeUp 0.75s 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        /* Mode cards */
        .mode-card { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; }
        .mode-card:hover { transform: translateY(-6px); }

        /* Testimonial cards */
        .tcard { transition: box-shadow 0.22s ease, transform 0.22s ease; }
        .tcard:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(52,211,153,0.1) !important; }

        /* Cosmetic cards */
        .cosm-card { transition: border-color 0.2s ease, background 0.2s ease; }
        .cosm-card:hover { border-color: rgba(52,211,153,0.4) !important; background: rgba(52,211,153,0.04) !important; }

        /* Nav link animated underline */
        .nav-link { position: relative; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -3px; left: 0;
          width: 0; height: 1px;
          background: ${MINT};
          transition: width 0.25s ease;
        }
        .nav-link:hover::after { width: 100%; }

        /* Mode CTA slide arrow */
        .mode-cta { transition: gap 0.2s ease; }
        .mode-cta:hover { gap: 10px !important; }

        /* Play button lift */
        .play-btn { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .play-btn:hover { transform: translateY(-2px); }

        /* Hero inklings layout */
        .hero-inklings-wrap   { display: flex; justify-content: center; align-items: center; }
        .hero-inklings-circle { position: relative; width: min(340px, 85vw); height: min(340px, 85vw); }
        .hero-inkling-orb     { position: absolute; transform: translate(-50%, -50%); }
        @media (max-width: 600px) {
          .hero-inklings-circle { width: min(270px, 90vw); height: min(270px, 90vw); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-grid    { grid-template-columns: 1fr !important; text-align: center; }
          .hero-ctas    { justify-content: center !important; }
          .modes-grid   { grid-template-columns: 1fr !important; }
          .tiers-line   { display: none !important; }
          .vocab-grid   { grid-template-columns: 1fr !important; }
          .cosm-grid    { grid-template-columns: 1fr !important; }
          .cosm-center  { order: -1; }
          .testimonials { grid-template-columns: 1fr !important; }
          .story-grid   { grid-template-columns: 1fr !important; }
          .story-inner  { grid-template-columns: 1fr !important; }
          .story-avatars { display: none !important; }
          .cta-img      { display: none !important; }
          .footer-grid  { grid-template-columns: 1fr 1fr !important; }
          .footer-brand { grid-column: 1 / -1; }
          .proof-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .proof-divider-2 { border-right: none !important; }
          .proof-divider-3 { border-right: none !important; }
          .slabel-left  { justify-content: center !important; }
        }
        @media (max-width: 600px) {
          .proof-grid { grid-template-columns: 1fr !important; }
          .proof-divider-0, .proof-divider-1, .proof-divider-2 { border-right: none !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .hamburger   { display: flex !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════════
          1. NAVBAR
      ════════════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        background: scrolled ? "rgba(8,15,26,0.94)" : "transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: DARK, border: `1.5px solid rgba(52,211,153,0.22)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", padding: "4px" }}>
              <LogoIcon className="w-full h-full" style={{ minWidth: "24px", minHeight: "24px" }} />
            </div>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "white", whiteSpace: "nowrap", fontFamily: BODY }}>
              Lexicon<span style={{ color: BLUE }}>League</span>
            </span>
          </Link>

          {/* Center nav — desktop */}
          <div style={{ display: "flex", gap: "32px", alignItems: "center", flex: 1, justifyContent: "center" }} className="nav-desktop">
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Game Modes",   href: "#game-modes" },
              { label: "Study",        href: "#vocabulary" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="nav-link"
                style={{ fontSize: "0.84rem", fontWeight: 500, color: MUTED, textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap", letterSpacing: "0.01em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
            <Link
              href="/teacher"
              style={{ padding: "9px 18px", borderRadius: "8px", border: `1.5px solid ${MINT}`, color: MINT, fontSize: "0.84rem", fontWeight: 600, textDecoration: "none", transition: "all 0.2s", whiteSpace: "nowrap", background: `${MINT}0D` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${MINT}22`; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = MINT; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${MINT}0D`; e.currentTarget.style.color = MINT; e.currentTarget.style.borderColor = MINT; }}
            >
              For Teachers
            </Link>
            <Link
              href="/auth/login"
              style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.13)", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", fontWeight: 600, textDecoration: "none", transition: "border-color 0.2s, color 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)"; e.currentTarget.style.color = "rgba(255,255,255,0.78)"; }}
            >
              Log In
            </Link>
            <Link
              href={playHref}
              style={{ padding: "9px 22px", borderRadius: "8px", background: `linear-gradient(135deg, ${BLUE} 0%, #1D4ED8 100%)`, color: "white", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(59,130,246,0.4)", transition: "opacity 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(59,130,246,0.55)"; e.currentTarget.style.opacity = "0.92"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.4)"; e.currentTarget.style.opacity = "1"; }}
            >
              Play Free
            </Link>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="hamburger"
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px", display: "none", flexShrink: 0 }}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {menuOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: DARK, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 28px 24px" }}>
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Game Modes",   href: "#game-modes" },
              { label: "Study",        href: "#vocabulary" },
              { label: "For Teachers", href: "/teacher" },
            ].map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: MUTED, fontSize: "0.95rem", fontWeight: 500, textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", color: "white", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", marginTop: "4px" }}>
              Log In
            </Link>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════════════════════
          2. HERO
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="hero" style={{ position: "relative", minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", padding: "100px 24px 120px", overflow: "hidden" }}>
        {/* Floating vocabulary words */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {FLOAT_WORDS.map((word, i) => (
            <span
              key={word}
              className="float-word"
              style={{
                left: `${(i * 6.1 + 4) % 92}%`,
                bottom: "-5%",
                "--rot": `${(i * 13 - 25) % 36}deg`,
                "--dur": `${15 + (i * 2.8) % 12}s`,
                "--delay": `${(i * 1.7) % 12}s`,
                "--fs":  `${0.95 + (i * 0.12) % 0.6}rem`,
              } as React.CSSProperties}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Background glows */}
        <div style={{ position: "absolute", top: "50%", right: "6%", transform: "translateY(-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "440px", height: "440px", borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

        <div
          className="hero-grid"
          style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "center" }}
        >
          {/* Left: copy */}
          <div>
            {/* Season eyebrow badge */}
            <div className="ha1" style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={{ position: "relative", flexShrink: 0, transform: "rotate(-6deg)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: DARK, border: `2px solid ${MINT}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LogoIcon className="w-6 h-6" />
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.1rem", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)", lineHeight: 1, pointerEvents: "none", fontFamily: BODY }}>1</div>
              </div>
              <div>
                <p style={{ fontSize: "0.62rem", fontWeight: 700, color: MINT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2px", fontFamily: BODY }}>Season 1</p>
                <p style={{ fontSize: "0.83rem", fontWeight: 400, color: MUTED, lineHeight: 1.2, fontFamily: BODY }}>Vocabulary & punctuation. 60 seconds.</p>
              </div>
            </div>

            {/* Headline — typographic stack */}
            <h1 className="ha2" style={{ marginBottom: "28px", lineHeight: 1 }}>
              <span style={{ display: "block", fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 900, fontSize: "clamp(3.2rem, 8vw, 5.6rem)", color: MINT, lineHeight: 0.92, letterSpacing: "-0.02em" }}>
                Words
              </span>
              <span style={{ display: "block", fontFamily: BODY, fontWeight: 300, fontSize: "clamp(1.4rem, 3.2vw, 2.1rem)", color: "rgba(255,255,255,0.45)", letterSpacing: "0.01em", margin: "10px 0 6px" }}>
                are your
              </span>
              <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(2.6rem, 6.5vw, 4.6rem)", color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
                superpower.
              </span>
            </h1>

            <p className="ha3" style={{ fontSize: "1.05rem", color: MUTED, lineHeight: 1.78, marginBottom: "44px", maxWidth: "480px", fontWeight: 400 }}>
              Master vocabulary and punctuation in 60-second rounds. Climb the ranked ladder from Bronze to Emerald, earn trophies, and unlock cosmetics for your Inkling avatar. Free to play — no subscription required.
            </p>

            <div className="hero-ctas ha4" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href={playHref}
                className="play-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 38px", borderRadius: "10px", background: `linear-gradient(135deg, ${BLUE} 0%, #1D4ED8 100%)`, color: "white", fontSize: "1rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 24px rgba(59,130,246,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(59,130,246,0.55)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.4)"; }}
              >
                Play Free
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right: Inklings circle */}
          <div className="hero-inklings-wrap">
            <div className="hero-inklings-circle">
              {/* Background glow */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "100%", height: "100%", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 65%)", pointerEvents: "none" }} />
              {/* Orbit ring */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "85%", height: "85%", borderRadius: "50%", border: "1px dashed rgba(59,130,246,0.2)", pointerEvents: "none" }} />

              {/* 6 surrounding inklings */}
              <div className="hero-inkling-orb" style={{ left: "85%",   top: "50%" }}><InkAvatar config={{ base: "droplet_02", color: "#22C55E", eyes: "eyes_02", accessory: "crown_01",   aura: "aura_glow_01" }} size={64} /></div>
              <div className="hero-inkling-orb" style={{ left: "67.5%", top: "19%" }}><InkAvatar config={{ base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01",  aura: "none"         }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "32.5%", top: "19%" }}><InkAvatar config={{ base: "droplet_01", color: "#DC2626", eyes: "eyes_02", accessory: "none",        aura: "none"         }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "15%",   top: "50%" }}><InkAvatar config={{ base: "droplet_01", color: "#0EA5E9", eyes: "eyes_03", accessory: "quill_01",   aura: "none"         }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "32.5%", top: "81%" }}><InkAvatar config={{ base: "droplet_02", color: "#C0C0C0", eyes: "eyes_04", accessory: "monocle_01", aura: "none"         }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "67.5%", top: "81%" }}><InkAvatar config={{ base: "droplet_01", color: "#D4AF37", eyes: "eyes_02", accessory: "crown_01",   aura: "aura_glow_03" }} size={64} /></div>
              {/* Main center */}
              <div className="hero-inkling-orb" style={{ left: "50%",   top: "50%", zIndex: 1 }}><InkAvatar config={{ base: "droplet_01", color: BLUE, eyes: "eyes_03", accessory: "glasses_01", aura: "aura_glow_01" }} size={140} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. SOCIAL PROOF BAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div id="social-proof" style={{ background: CARD, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="proof-grid"
          style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}
        >
          {[
            { value: "200+", label: "Students Playing" },
            { value: "15K+", label: "Questions Answered" },
            { value: "10",   label: "Vocabulary Tiers" },
            { value: "5★",   label: "Average Rating" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`proof-divider-${i}`}
              style={{ textAlign: "center", padding: "36px 16px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              <p style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 700, color: MINT, marginBottom: "6px", fontFamily: DISPLAY, fontStyle: "italic" }}>{stat.value}</p>
              <p style={{ fontSize: "0.78rem", color: MUTED, fontWeight: 500, letterSpacing: "0.03em" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          4. HOW IT WORKS
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <SLabel>GET STARTED</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", fontFamily: DISPLAY }}>
            Simple Start. Real Results.
          </h2>
        </div>

        {/* Steps with connecting line */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
          <div
            className="tiers-line"
            style={{ position: "absolute", top: "36px", left: "calc(16.67% + 16px)", right: "calc(16.67% + 16px)", height: "1px", background: `linear-gradient(90deg, ${MINT}15, ${MINT}55, ${MINT}15)`, zIndex: 0 }}
          />

          {[
            { Icon: UserIcon,   title: "Create Your Account", num: "01", desc: "Sign up free with email or Google. Guest mode lets you play immediately — no account required." },
            { Icon: ZapIcon,    title: "Choose Your Mode",    num: "02", desc: "Casual for practice, Ranked for trophies, or Study for self-paced mastery with spaced repetition." },
            { Icon: TrophyIcon, title: "Climb the Ranks",     num: "03", desc: "Earn trophies, level up, and unlock exclusive cosmetics for your Inkling avatar." },
          ].map((step) => {
            const Icon = step.Icon;
            return (
              <div key={step.num} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                {/* Large watermark step number */}
                <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "7rem", fontWeight: 900, fontFamily: DISPLAY, color: "rgba(59,130,246,0.055)", lineHeight: 1, userSelect: "none", pointerEvents: "none", letterSpacing: "-0.05em", whiteSpace: "nowrap" }}>
                  {step.num}
                </div>
                {/* Icon circle */}
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: DARK, border: `1.5px solid ${MINT}60`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", position: "relative" }}>
                  <Icon className="w-7 h-7" color={MINT} />
                  <span style={{ position: "absolute", bottom: "-8px", right: "-8px", background: MINT, color: DARK, fontSize: "0.55rem", fontWeight: 900, borderRadius: "100px", padding: "2px 7px", fontFamily: BODY }}>
                    {step.num}
                  </span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "10px", fontFamily: BODY }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: "56px", fontSize: "0.85rem", color: FAINT, fontStyle: "italic" }}>
          No subscription required. Play as much as you want, whenever you want.
        </p>

        {/* Meet Sir Inksworth */}
        <div style={{ marginTop: "60px", maxWidth: "560px", marginLeft: "auto", marginRight: "auto", display: "flex", alignItems: "center", gap: "24px", padding: "24px 28px", background: CARD, border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${MINT}40`, borderRadius: "14px" }}>
          <div style={{ flexShrink: 0 }}>
            <InkAvatar config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }} size={80} />
          </div>
          <div>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, color: MINT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Meet Your League Guide</p>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", marginBottom: "8px" }}>Sir Inksworth</p>
            <p style={{ fontSize: "0.88rem", color: MUTED, lineHeight: 1.65, fontStyle: "italic", fontFamily: DISPLAY }}>
              &ldquo;I will show you around so you can jump in fast and play with confidence.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          5. GAME MODES
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="game-modes" style={{ background: DARK, padding: "110px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SLabel>GAME MODES</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", fontFamily: DISPLAY }}>
              Choose Your Challenge
            </h2>
          </div>

          <div className="modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            {[
              {
                title: "Casual Mode",
                accent: BLUE,
                glow:   "rgba(59,130,246,0.22)",
                avatar: { base: "droplet_01", color: BLUE,      eyes: "eyes_03", accessory: "glasses_01", aura: "none"         },
                sub:    "Practice Without Pressure",
                tags:   ["1v1 or 3v3 · 60-second rounds", "Vocabulary or Punctuation", "Grade 3 → AP Lit", "Party up with friends"],
                desc:   "Warm up with friends or solo. No rank impact — just pure practice.",
                cta:    "Play Casual",
                href:   playHref,
              },
              {
                title: "Ranked Mode",
                accent: "#FBBF24",
                glow:   "rgba(251,191,36,0.18)",
                avatar: { base: "droplet_02", color: "#22C55E", eyes: "eyes_02", accessory: "crown_01",   aura: "aura_glow_01" },
                icon:   TrophyIcon,
                sub:    "Prove Your Rank",
                tags:   ["Bronze → Emerald ladder", "Trophy-based matchmaking", "Win streak bonuses (up to 3×)", "Rank-exclusive rewards"],
                desc:   "Earn trophies, climb the ladder, and unlock exclusive cosmetics.",
                cta:    "View Leaderboard",
                href:   playHref,
              },
              {
                title: "Study Mode",
                accent: "#A78BFA",
                glow:   "rgba(167,139,250,0.18)",
                avatar: { base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01",  aura: "none"         },
                sub:    "Learn at Your Own Pace",
                tags:   ["Spaced repetition", "10 tiers: Grade 3 → AP Lit", "Word mastery tracking (0–100%)", "Earn XP + Ink Drops"],
                desc:   "Self-paced practice with spaced repetition. No timer, no pressure.",
                cta:    "Start Studying",
                href:   playHref,
              },
              {
                title: "Classroom Mode",
                accent: "#0EA5E9",
                glow:   "rgba(14,165,233,0.18)",
                avatar: { base: "droplet_01", color: "#0EA5E9", eyes: "eyes_03", accessory: "quill_01", aura: "none" },
                sub:    "For Teachers",
                tags:   ["20+ player lobbies", "Live vocabulary challenges", "Real-time progress tracking", "Alpha"],
                desc:   "Host live sessions for your whole class. Compete together and track progress in real time.",
                cta:    "Try Alpha",
                href:   "/play/classroom",
              },
            ].map((mode) => (
              <div
                key={mode.title}
                className="mode-card"
                style={{ background: CARD, borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 20px 56px ${mode.glow}`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                {/* Gradient colored header with avatar */}
                <div style={{ position: "relative", height: "160px", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(180deg, ${mode.accent}18 0%, ${mode.accent}05 100%)`, borderBottom: `1px solid ${mode.accent}18` }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: mode.accent }} />
                  <InkAvatar config={mode.avatar} size={120} />
                </div>

                <div style={{ padding: "22px 22px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {"icon" in mode && mode.icon ? (() => { const Icon = mode.icon; return <Icon className="w-5 h-5 shrink-0" color={mode.accent} />; })() : null}
                    {mode.title}
                  </h3>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, color: mode.accent, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{mode.sub}</p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "16px" }}>
                    {mode.tags.map((tag) => (
                      <span key={tag} style={{ padding: "3px 9px", borderRadius: "100px", border: `1px solid ${mode.accent}28`, fontSize: "0.7rem", fontWeight: 500, color: MUTED, background: `${mode.accent}08` }}>{tag}</span>
                    ))}
                  </div>

                  <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.68, flex: 1, marginBottom: "20px" }}>{mode.desc}</p>

                  <Link
                    href={mode.href}
                    className="mode-cta"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 700, color: mode.accent, textDecoration: "none", alignSelf: "flex-start" }}
                  >
                    {mode.cta}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          6. RANK SYSTEM
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="ranks" style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SLabel>PROGRESSION</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", marginBottom: "16px", fontFamily: DISPLAY }}>
            Climb from Bronze to Emerald
          </h2>
          <p style={{ fontSize: "1rem", color: MUTED, maxWidth: "560px", margin: "0 auto", lineHeight: 1.75 }}>
            Win matches to earn trophies and rank up. New players get a placement match to find their starting tier. Build win streaks for up to 3× bonus trophies.
          </p>
        </div>

        {/* Trophy ladder */}
        <div style={{ marginBottom: "40px", maxWidth: "700px", margin: "0 auto 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: FAINT }}>0</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: MUTED }}>Trophies</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: FAINT }}>2,500</span>
          </div>
          <div style={{ display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { tier: "Bronze"   as RankTier, width: 4  },
              { tier: "Silver"   as RankTier, width: 10 },
              { tier: "Gold"     as RankTier, width: 26 },
              { tier: "Platinum" as RankTier, width: 20 },
              { tier: "Diamond"  as RankTier, width: 32 },
              { tier: "Emerald"  as RankTier, width: 8  },
            ].map(({ tier, width }) => (
              <div
                key={tier}
                style={{ width: `${width}%`, backgroundColor: RANK_COLORS[tier], opacity: 0.82 }}
                title={`${RANK_THRESHOLDS[tier]}+ trophies`}
              />
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "6px", fontSize: "0.62rem", color: FAINT }}>
            {RANK_TIERS.map((t, i) => (
              <span key={t} style={{ width: `${[4, 10, 26, 20, 32, 8][i]}%`, textAlign: "left" }}>
                {RANK_THRESHOLDS[t] >= 1000 ? `${RANK_THRESHOLDS[t] / 1000}K` : RANK_THRESHOLDS[t]}
              </span>
            ))}
          </div>
        </div>

        {/* Win streak callout */}
        <div style={{ marginTop: "52px", background: CARD, border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid #F59E0B", borderRadius: "12px", padding: "22px 28px", display: "flex", alignItems: "flex-start", gap: "14px", maxWidth: "600px", margin: "52px auto 0" }}>
          <div style={{ flexShrink: 0, marginTop: "2px" }}>
            <FlameIcon className="w-6 h-6" color="#F59E0B" />
          </div>
          <div>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", marginBottom: "6px" }}>Win Streak Bonus</p>
            <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.68 }}>
              Win 10 games in a row to unlock the full 3× trophy multiplier. Every win counts — keep the streak alive!
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          7. VOCABULARY SCOPE
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="vocabulary" style={{ background: DARK, padding: "110px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            className="vocab-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}
          >
            {/* Left: tier pills */}
            <div>
              <div className="slabel-left">
                <SLabel align="left">CURRICULUM</SLabel>
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: "white", marginBottom: "16px", fontFamily: DISPLAY }}>
                Vocabulary Built for Every Level
              </h2>
              <p style={{ fontSize: "1rem", color: MUTED, lineHeight: 1.75, marginBottom: "32px" }}>
                From Grade 3 foundations through AP Literature. Aligned with College Board Pre-AP and AP English. Context clues, definitions, synonyms, rhetoric, and more.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "Grade 3",          ap: false },
                  { label: "Grade 4",          ap: false },
                  { label: "Grade 5",          ap: false },
                  { label: "Grade 6",          ap: false },
                  { label: "Grade 7",          ap: false },
                  { label: "Pre-AP English 1", ap: false },
                  { label: "Pre-AP English 2", ap: false },
                  { label: "English 3",        ap: false },
                  { label: "AP Language",      ap: true  },
                  { label: "AP Literature",    ap: true  },
                ].map((t) => (
                  <span key={t.label} style={{
                    padding: "5px 14px", borderRadius: "100px",
                    border: `1.5px solid ${t.ap ? MINT : "rgba(255,255,255,0.12)"}`,
                    fontSize: "0.78rem", fontWeight: 600,
                    color: t.ap ? MINT : MUTED,
                    background: t.ap ? `${MINT}0D` : "transparent",
                  }}>
                    {t.label}
                  </span>
                ))}
              </div>

              <p style={{ marginTop: "20px", fontSize: "0.78rem", color: FAINT, fontStyle: "italic" }}>
                New word sets added each season.
              </p>
            </div>

            {/* Right: skill tag cloud */}
            <div>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "20px" }}>
                Skill types covered
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {[
                  ["Definitions",         BLUE],
                  ["Context Clues",       MINT],
                  ["Synonyms",            "#A78BFA"],
                  ["Antonyms",            "#F97316"],
                  ["Word Forms",          "#EC4899"],
                  ["Theme & Craft",       BLUE],
                  ["Story Elements",      MINT],
                  ["Figurative Language", "#A78BFA"],
                  ["Rhetoric",            "#F97316"],
                  ["Argument",            BLUE],
                  ["Inference",           MINT],
                  ["Author's Purpose",    "#A78BFA"],
                ].map(([skill, color]) => (
                  <span key={skill as string} style={{
                    padding: "6px 16px", borderRadius: "100px",
                    border: `1px solid ${color as string}45`,
                    fontSize: "0.83rem", fontWeight: 500,
                    color: color as string, background: `${color as string}10`,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          8. CUSTOMIZATION / INKLINGS SHOWCASE
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="inklings" style={{ maxWidth: "1200px", margin: "0 auto", padding: "110px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SLabel>YOUR INKLING</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", marginBottom: "16px", fontFamily: DISPLAY }}>
            Make It Yours
          </h2>
          <p style={{ fontSize: "1rem", color: MUTED, maxWidth: "500px", margin: "0 auto", lineHeight: 1.75 }}>
            Customize your Inkling avatar with shapes, colors, eyes, gear, and auras. Earn Ink Drops in-game and spend them in the Ink Shop. Rank-exclusive cosmetics unlock as you climb.
          </p>
        </div>

        <div className="cosm-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "24px", alignItems: "center" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { Icon: CircleIcon,  title: "Shapes",  desc: "Classic, Blobby, Pointed, Ghost, Splat — 5 droplet shapes." },
              { Icon: EyeIcon,     title: "Eyes",    desc: "8 styles — Friendly, Determined, Sparkle, Cool, and more." },
              { Icon: PaletteIcon, title: "Colors",  desc: "20+ colors including rank-exclusive Bronze through Emerald." },
            ].map((cat) => {
              const Icon = cat.Icon;
              return (
                <div key={cat.title} className="cosm-card" style={{ background: CARD, border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center", color: MINT, marginTop: "1px" }}>
                    <Icon className="w-5 h-5" color={MINT} />
                  </span>
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", marginBottom: "2px" }}>{cat.title}</p>
                    <p style={{ fontSize: "0.74rem", color: MUTED, lineHeight: 1.5 }}>{cat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center: large Inkling with decorative ring */}
          <div className="cosm-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", width: "244px", height: "244px", borderRadius: "50%", border: "1px solid rgba(212,175,55,0.18)", background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)" }} />
              <InkAvatar config={{ base: "droplet_02", color: "#D4AF37", eyes: "eyes_05", accessory: "crown_01", aura: "aura_glow_01" }} size={200} />
            </div>
            <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: "100px", background: DARK, border: `1px solid ${MINT}`, fontSize: "0.68rem", fontWeight: 600, color: MINT, textAlign: "center" }}>
              Rank-exclusive cosmetics unlock as you climb
            </span>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { Icon: CrownIcon,   title: "Gear",      desc: "Crown, Wizard Hat, Glasses, Sword, Shield — medieval, fancy, and track collections." },
              { Icon: SparkIcon,   title: "Auras",     desc: "Glow effects — unlock via level rewards or purchase packs." },
              { Icon: InkDropIcon, title: "Ink Drops", desc: "Earned in every game. Spend in the Ink Shop or claim daily rewards." },
            ].map((cat) => {
              const Icon = cat.Icon;
              return (
                <div key={cat.title} className="cosm-card" style={{ background: CARD, border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center", color: MINT, marginTop: "1px" }}>
                    <Icon className="w-5 h-5" color={MINT} />
                  </span>
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", marginBottom: "2px" }}>{cat.title}</p>
                    <p style={{ fontSize: "0.74rem", color: MUTED, lineHeight: 1.5 }}>{cat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          9. TESTIMONIALS
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="community" style={{ background: DARK, padding: "110px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SLabel>COMMUNITY</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", fontFamily: DISPLAY }}>
              What Players Are Saying
            </h2>
          </div>

          <div className="testimonials" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { quote: "I actually ask to play during free time now. It's the only vocab game I like.", name: "Philip", role: "Diamond-ranked student" },
              { quote: "I use Lexicon League for warm-ups and review. The ranked mode keeps my 8th graders engaged and competitive.", name: "Ms. Chen", role: "8th Grade ELA Teacher" },
              { quote: "My kid went from dreading vocab to asking for 'one more round.' The Inklings are adorable.", name: "Parent", role: "Parent" },
            ].map((t, i) => (
              <div
                key={i}
                className="tcard"
                style={{ background: CARD, border: "1px solid rgba(255,255,255,0.07)", borderTop: `2px solid ${MINT}38`, borderRadius: "14px", padding: "32px 26px", position: "relative" }}
              >
                {/* Large decorative quote mark */}
                <div style={{ fontFamily: DISPLAY, fontSize: "5.5rem", color: `${MINT}16`, lineHeight: 0.75, marginBottom: "16px", userSelect: "none", fontWeight: 900 }}>
                  &ldquo;
                </div>
                <p style={{ fontSize: "0.93rem", color: MUTED, lineHeight: 1.75, marginBottom: "28px", fontStyle: "italic" }}>
                  {t.quote}
                </p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", marginBottom: "3px" }}>{t.name}</p>
                  <p style={{ fontSize: "0.76rem", color: MINT, fontWeight: 500, fontStyle: "italic" }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          10. COMING SOON — STORY MODE
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="story-mode" style={{ padding: "80px 24px" }}>
        <div
          className="story-grid"
          style={{
            background: "linear-gradient(135deg, rgba(190,18,60,0.12) 0%, rgba(15,23,42,0.6) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            maxWidth: "1100px",
            margin: "0 auto",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 6px 24px rgba(190,18,60,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ position: "absolute", top: "50%", left: "15%", transform: "translate(-50%,-50%)", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(190,18,60,0.14) 0%, transparent 65%)", pointerEvents: "none" }} />

          <div className="story-inner" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "48px", alignItems: "center", padding: "72px 60px", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 800, color: "white", letterSpacing: "0.12em", textTransform: "uppercase", background: "#9F1239", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>Coming Soon</span>
              </div>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "white", marginBottom: "16px", lineHeight: 1.08, fontFamily: DISPLAY }}>
                Story Mode
              </h2>
              <p style={{ fontSize: "1rem", color: MUTED, lineHeight: 1.75 }}>
                <strong style={{ color: "#BE123C" }}>Story Mode:</strong> Chapters, boss battles, and exclusive loot. A narrative adventure through the world of words. Defeat vocab villains and unlock story rewards.
              </p>
            </div>

            <div className="story-avatars" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "24px", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "relative", padding: "24px 28px 20px", background: "linear-gradient(180deg, rgba(190,18,60,0.15) 0%, rgba(30,30,50,0.4) 60%)", borderRadius: "16px", border: "1px solid rgba(190,18,60,0.22)", boxShadow: "0 4px 16px rgba(190,18,60,0.14)" }}>
                  <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", width: "60%", height: "4px", background: "linear-gradient(90deg, transparent, rgba(220,38,38,0.4), transparent)", borderRadius: "2px", opacity: 0.8 }} />
                  <InkAvatar config={{ base: "droplet_01", color: "#DC2626", eyes: "eyes_02", accessory: "none", aura: "none" }} size={160} />
                </div>
                <span style={{ marginTop: "8px", fontSize: "0.68rem", fontWeight: 700, color: "#BE123C" }}>Story</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          11. FINAL CTA BANNER
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="cta" style={{ padding: "80px 24px 100px" }}>
        <div style={{
          borderRadius: "20px",
          background: "linear-gradient(135deg, #1D4ED8 0%, #065F46 100%)",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 60px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
        }}>
          {/* Decorative orbs */}
          <div style={{ position: "absolute", top: "-60px",  left: "-60px",  width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-80px", right: "38%", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          {/* Subtle diagonal line pattern */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

          {/* Text */}
          <div style={{ position: "relative", zIndex: 1, maxWidth: "540px" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", marginBottom: "16px", lineHeight: 1.08, fontFamily: DISPLAY }}>
              Ready to Level Up Your Words?
            </h2>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.8)", marginBottom: "36px", lineHeight: 1.68 }}>
              Join free. No subscription required. Start playing in seconds.
            </p>
            <Link
              href={playHref}
              className="play-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 44px", borderRadius: "10px", background: "white", color: "#1D4ED8", fontSize: "1.05rem", fontWeight: 800, textDecoration: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.22)" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.22)"; }}
            >
              Play Free Now
              <ArrowRight size={16} />
            </Link>
            <p style={{ marginTop: "14px", fontSize: "0.78rem", color: "rgba(255,255,255,0.44)", fontStyle: "italic" }}>
              Guest mode available. No credit card needed.
            </p>
          </div>

          {/* Sir Inksworth */}
          <div className="cta-img" style={{ flexShrink: 0, position: "relative", zIndex: 1, textAlign: "center" }}>
            <InkAvatar config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }} size={200} />
            <p style={{ marginTop: "12px", fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>Sir Inksworth</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          12. FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer id="footer" style={{ background: DARK, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          className="footer-grid"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px 48px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "48px" }}
        >
          {/* Brand column */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: CARD, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", padding: "4px" }}>
                <LogoIcon className="w-full h-full" style={{ minWidth: "24px", minHeight: "24px" }} />
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "white" }}>Lexicon<span style={{ color: BLUE }}>League</span></span>
            </div>
            <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.68, marginBottom: "24px" }}>
              Words are your superpower. Vocabulary and punctuation for Grades 4–8 and beyond.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { label: "Discord",    d: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" },
                { label: "X / Twitter", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "Instagram",   d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  title={s.label}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", background: CARD, border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s", flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${MINT}50`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill={MUTED}><path d={s.d} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {(
            [
              {
                title: "Play",
                links: [
                  { label: "Casual Mode",   href: "/play/casual" },
                  { label: "Ranked Mode",  href: "/ranked" },
                  { label: "Study Mode",   href: "/study" },
                  { label: "Classroom Mode", href: "/play/classroom" },
                  { label: "Teacher Portal", href: "/teacher" },
                  { label: "Leaderboard",  href: "/ranked" },
                ],
              },
              {
                title: "Progress",
                links: [
                  { label: "Rank Tiers",   href: "/ranked" },
                  { label: "Ink Shop",     href: "/shop" },
                  { label: "Ink Locker",   href: "/locker" },
                  { label: "Daily Rewards",href: "/shop" },
                ],
              },
              {
                title: "Learn More",
                links: [
                  { label: "About",    href: "/#hero" },
                  { label: "FAQ",      href: "/#how-it-works" },
                  { label: "Blog",     href: "#" },
                  { label: "Careers",  href: "#" },
                ],
              },
              {
                title: "Support",
                links: [
                  { label: "Help Center",    href: "#" },
                  { label: "Contact",        href: "#" },
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Use",   href: "#" },
                ],
              },
            ] as { title: string; links: { label: string; href: string }[] }[]
          ).map((col) => (
            <div key={col.title}>
              <p style={{ fontSize: "0.67rem", fontWeight: 700, color: "white", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "16px" }}>
                {col.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map((link, i) => (
                  <Link
                    key={`${col.title}-${i}`}
                    href={link.href}
                    style={{ fontSize: "0.86rem", color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", maxWidth: "1200px", margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "0.78rem", color: FAINT }}>
            © 2025 Lexicon League · All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: CARD, border: "1px solid rgba(255,255,255,0.08)" }}>
              <InkAvatar config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }} size={26} />
            </div>
            <span style={{ fontSize: "0.72rem", color: FAINT }}>Built with Sir Inksworth&apos;s blessing</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
