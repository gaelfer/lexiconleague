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

// ── Inline icons for marketing (User, Eye, Palette, Crown, Zap) ───────────────
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
function GiftIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 8 12 8" />
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
const MINT = "#34D399";
const BLUE = "#3B82F6";
const DARK = "#0F172A";
const CARD = "#1E293B";
const SURFACE = "#080F1A";
const MUTED = "#94A3B8";
const FAINT = "#475569";

// ── Utility components ────────────────────────────────────────────────────────

/** Tier icon SVG — matches ranked/leaderboard page */
function BigTierIcon({ tier, color, size = 56 }: { tier: RankTier; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let svg: React.ReactNode;
  if (tier === "Bronze") {
    svg = (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}20`} stroke={color} strokeWidth="2.5" />
        <path d="M32 16L44 24V40Q32 50 20 40V24L32 16Z" fill={`${color}22`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M32 24L32 40" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
      </svg>
    );
  } else if (tier === "Silver") {
    svg = (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}15`} stroke={color} strokeWidth="2.5" />
        <circle cx="32" cy="32" r="20" {...common} strokeDasharray="4 3" />
        <path d="M32 20v12l6 6" {...common} strokeWidth="2.5" />
      </svg>
    );
  } else if (tier === "Gold") {
    svg = (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}15`} stroke={color} strokeWidth="2" />
        <path d="M20 50h24M32 42v8M42 12H22l-5 12c0 9.5 6.7 17 15 17s15-7.5 15-17L42 12z" {...common} strokeWidth="2.5" />
        <path d="M17 24h-5l-2 8h8M47 24h5l2 8h-8" {...common} strokeWidth="2" />
      </svg>
    );
  } else if (tier === "Platinum") {
    svg = (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}10`} stroke={color} strokeWidth="2" />
        <path d="M32 8L8 20l24 12 24-12L32 8z" {...common} strokeWidth="2.5" />
        <path d="M8 44l24 12 24-12" {...common} strokeWidth="2" />
        <path d="M8 32l24 12 24-12" {...common} strokeWidth="2" />
      </svg>
    );
  } else if (tier === "Emerald") {
    svg = (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}15`} stroke={color} strokeWidth="2.5" />
        <path d="M32 12l4 12 12 1.5-9 8 3 12-10-6-10 6 3-12-9-8 12-1.5L32 12z" fill={`${color}30`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  } else {
    // Diamond — faceted gem (brilliant cut)
    svg = (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}10`} stroke={color} strokeWidth="2" />
        <path d="M32 10L44 22L48 32L44 42L32 54L20 42L16 32L20 22Z" fill={`${color}28`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      {svg}
    </div>
  );
}

/** Section eyebrow label */
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      letterSpacing: "0.15em",
      fontSize: "0.72rem",
      color: MINT,
      textTransform: "uppercase",
      fontWeight: 800,
      marginBottom: "12px",
    }}>
      {children}
    </p>
  );
}

// ── Floating background words for hero ───────────────────────────────────────
const FLOAT_WORDS = [
  "define", "synonym", "rhetoric", "analogy", "context", "lexicon",
  "vocab", "diction", "clauses", "syntax", "prose", "verse", "nuance",
  "allusion", "ethos", "logos",
];

// ── Page component ────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    <div style={{ background: DARK, color: "white", overflowX: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Ready to play? popup (logged-in users) ── */}
      {showReadyPopup && user && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              position: "relative",
              background: CARD,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "40px 48px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            }}
          >
            <button
              onClick={() => setShowReadyPopup(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: MUTED,
                cursor: "pointer",
                padding: "4px",
                fontSize: "1.25rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginBottom: "12px" }}>Ready to play?</h3>
            <p style={{ fontSize: "0.95rem", color: MUTED, marginBottom: "24px", lineHeight: 1.5 }}>Jump back into the action and keep climbing the ranks.</p>
            <Link
              href="/dashboard"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                borderRadius: "12px",
                background: BLUE,
                color: "white",
                fontSize: "1rem",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
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
          0%   { transform: translateY(0px) rotate(var(--rot)); opacity: 0; }
          8%   { opacity: 0.18; }
          92%  { opacity: 0.18; }
          100% { transform: translateY(-110vh) rotate(var(--rot)); opacity: 0; }
        }
        .float-word {
          position: absolute;
          pointer-events: none;
          font-weight: 900;
          font-size: var(--fs, 1rem);
          color: rgba(59, 130, 246, 0.3);
          animation: floatUp var(--dur, 18s) var(--delay, 0s) linear infinite;
          user-select: none;
          white-space: nowrap;
        }

        /* Mode cards lift on hover */
        .mode-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .mode-card:hover { transform: translateY(-4px); }

        /* Testimonial glow on hover */
        .tcard { transition: box-shadow 0.22s ease; }
        .tcard:hover { box-shadow: 0 0 24px rgba(52, 211, 153, 0.15) !important; }

        /* Cosmetic category card */
        .cosm-card { transition: border-color 0.2s ease; }
        .cosm-card:hover { border-color: rgba(52, 211, 153, 0.45) !important; }

        /* Tier node */
        .tier-node { cursor: default; }

        /* Hero Inklings — circle around main, responsive */
        .hero-inklings-wrap { display: flex; justify-content: center; align-items: center; }
        .hero-inklings-circle { position: relative; width: min(320px, 85vw); height: min(320px, 85vw); }
        .hero-inkling-orb { position: absolute; transform: translate(-50%, -50%); }
        @media (max-width: 600px) { .hero-inklings-circle { width: min(260px, 90vw); height: min(260px, 90vw); } }

        /* Responsive helpers */
        @media (max-width: 900px) {
          .hero-grid    { grid-template-columns: 1fr !important; text-align: center; }
          .hero-ctas    { justify-content: center !important; }
          .modes-grid   { grid-template-columns: 1fr !important; }
          .tiers-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .tiers-line   { display: none !important; }
          .vocab-grid   { grid-template-columns: 1fr !important; }
          .cosm-grid    { grid-template-columns: 1fr !important; }
          .cosm-center  { order: -1; }
          .testimonials { grid-template-columns: 1fr !important; }
          .story-grid   { grid-template-columns: 1fr !important; }
          .story-inner  { grid-template-columns: 1fr !important; }
          .cta-img      { display: none !important; }
          .footer-grid  { grid-template-columns: 1fr 1fr !important; }
          .footer-brand { grid-column: 1 / -1; }
          .proof-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .proof-divider-2 { border-right: none !important; }
          .proof-divider-3 { border-right: none !important; }
        }
        @media (max-width: 600px) {
          .tiers-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .proof-grid   { grid-template-columns: 1fr !important; }
          .proof-divider-0, .proof-divider-1, .proof-divider-2 { border-right: none !important; }
          .footer-grid  { grid-template-columns: 1fr !important; }
          .email-row    { flex-direction: column !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════════
          1. NAVBAR
      ════════════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
        background: scrolled ? "rgba(15, 23, 42, 0.88)" : "transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: CARD, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", padding: "4px" }}>
              <LogoIcon className="w-full h-full" style={{ minWidth: "24px", minHeight: "24px" }} />
            </div>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "white", whiteSpace: "nowrap" }}>
              Lexicon<span style={{ color: BLUE }}>League</span>
            </span>
          </Link>

          {/* Center nav — desktop */}
          <div style={{ display: "flex", gap: "28px", alignItems: "center", flex: 1, justifyContent: "center" }} className="nav-desktop">
            {[
              { label: "Dashboard",   href: "/dashboard" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Game Modes",   href: "#game-modes" },
              { label: "Study",        href: "#vocabulary" },
              { label: "Leaderboard", href: "#ranks" },
              { label: "Shop",         href: "/shop" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: MUTED,
                  textDecoration: "none",
                  transition: "color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            <Link
              href="/auth/login"
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "1.5px solid rgba(255,255,255,0.18)",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "border-color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
            >
              Log In
            </Link>
            <Link
              href={playHref}
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                background: BLUE,
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Play Free
            </Link>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px", display: "none", flexShrink: 0 }}
              className="hamburger"
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: CARD, borderTop: "1px solid rgba(255,255,255,0.07)", padding: "8px 24px 20px" }}>
            {[
              { label: "Dashboard",   href: "/dashboard" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Game Modes",   href: "#game-modes" },
              { label: "Study",        href: "#vocabulary" },
              { label: "Leaderboard", href: "#ranks" },
              { label: "Shop",         href: "/shop" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "13px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  color: MUTED,
                  fontSize: "1rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {l.label}
              </a>
            ))}
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "13px 0", color: "white", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", marginTop: "4px" }}>
              Log In
            </Link>
          </div>
        )}

        {/* Hide/show hamburger via inline style injection */}
        <style>{`
          @media (max-width: 860px) {
            .nav-desktop { display: none !important; }
            .hamburger { display: flex !important; }
          }
        `}</style>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════════
          2. HERO
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="hero" style={{ position: "relative", padding: "80px 24px 100px", overflow: "hidden" }}>
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
                "--fs":  `${0.7 + (i * 0.13) % 0.7}rem`,
              } as React.CSSProperties}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Blue radial glow — right side */}
        <div style={{
          position: "absolute", top: "50%", right: "8%",
          transform: "translateY(-50%)",
          width: "560px", height: "560px", borderRadius: "50%",
          background: `radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 65%)`,
          pointerEvents: "none", zIndex: 0,
        }} />

        <div
          className="hero-grid"
          style={{
            position: "relative", zIndex: 1,
            maxWidth: "1200px", margin: "0 auto",
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "64px", alignItems: "center",
          }}
        >
          {/* Left: copy */}
          <div>
            {/* Season eyebrow badge — matches dashboard style */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div className="relative shrink-0" style={{ transform: "rotate(-6deg)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: DARK, border: `2px solid ${MINT}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LogoIcon className="w-6 h-6" />
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", fontFamily: "system-ui, sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)", lineHeight: 1 }}>1</div>
              </div>
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 800, color: MINT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>Season 1</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: MUTED, lineHeight: 1.2 }}>Vocabulary & punctuation. 60 seconds.</p>
              </div>
            </div>

            <h1 style={{
              fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.06,
              marginBottom: "24px",
              color: "white",
            }}>
              Words are your superpower.
            </h1>

            <p style={{ fontSize: "1.1rem", color: MUTED, lineHeight: 1.75, marginBottom: "40px", maxWidth: "500px" }}>
              Master vocabulary and punctuation in 60-second rounds. Climb the ranked ladder from Bronze to Emerald, earn trophies, and unlock cosmetics for your Inkling avatar. Free to play — no subscription required.
            </p>

            <div className="hero-ctas" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href={playHref}
                style={{
                  display: "inline-block",
                  padding: "15px 36px",
                  borderRadius: "12px",
                  background: BLUE,
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Play Free
              </Link>
            </div>
          </div>

          {/* Right: hero Inklings — circle around main */}
          <div className="hero-inklings-wrap">
            <div className="hero-inklings-circle">
              {/* Glow behind */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", borderRadius: "50%", background: `radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 65%)`, pointerEvents: "none" }} />
              {/* 6 inklings in circle — angles 0°, 60°, 120°, 180°, 240°, 300° (0° = right) */}
              <div className="hero-inkling-orb" style={{ left: "85%", top: "50%" }}><InkAvatar config={{ base: "droplet_02", color: "#22C55E", eyes: "eyes_02", accessory: "crown_01", aura: "aura_glow_01" }} size={64} /></div>
              <div className="hero-inkling-orb" style={{ left: "67.5%", top: "19%" }}><InkAvatar config={{ base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01", aura: "none" }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "32.5%", top: "19%" }}><InkAvatar config={{ base: "droplet_01", color: "#DC2626", eyes: "eyes_02", accessory: "none", aura: "none" }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "15%", top: "50%" }}><InkAvatar config={{ base: "droplet_01", color: "#0EA5E9", eyes: "eyes_03", accessory: "quill_01", aura: "none" }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "32.5%", top: "81%" }}><InkAvatar config={{ base: "droplet_02", color: "#C0C0C0", eyes: "eyes_04", accessory: "monocle_01", aura: "none" }} size={60} /></div>
              <div className="hero-inkling-orb" style={{ left: "67.5%", top: "81%" }}><InkAvatar config={{ base: "droplet_01", color: "#D4AF37", eyes: "eyes_02", accessory: "crown_01", aura: "aura_glow_03" }} size={64} /></div>
              {/* Main center */}
              <div className="hero-inkling-orb" style={{ left: "50%", top: "50%", zIndex: 1 }}><InkAvatar config={{ base: "droplet_01", color: BLUE, eyes: "eyes_03", accessory: "glasses_01", aura: "aura_glow_01" }} size={140} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. SOCIAL PROOF BAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div id="social-proof" style={{ background: CARD, borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          className="proof-grid"
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "0 24px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
        >
          {[
            { value: "10K+",           label: "Students Playing" },
            { value: "1M+",            label: "Questions Answered" },
            { value: "10",             label: "Vocabulary Tiers" },
            { value: "5★",             label: "Average Rating" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`proof-divider-${i}`}
              style={{
                textAlign: "center",
                padding: "32px 16px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <p style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", fontWeight: 900, color: MINT, marginBottom: "4px", fontStyle: "italic" }}>{stat.value}</p>
              <p style={{ fontSize: "0.8rem", color: MUTED, fontWeight: 600 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          4. HOW IT WORKS
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SLabel>GET STARTED</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "white" }}>
            Simple Start. Real Results.
          </h2>
        </div>

        {/* Steps grid with connecting line */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
          {/* Connecting gradient line — desktop only */}
          <div
            className="tiers-line"
            style={{
              position: "absolute",
              top: "35px",
              left: "calc(16.67% + 16px)",
              right: "calc(16.67% + 16px)",
              height: "2px",
              background: `linear-gradient(90deg, ${MINT}30, ${MINT}70, ${MINT}30)`,
              zIndex: 0,
            }}
          />

          {[
            { Icon: UserIcon, title: "Create Your Account", num: "01", desc: "Sign up free with email or Google. Guest mode lets you play immediately — no account required." },
            { Icon: ZapIcon, title: "Choose Your Mode",    num: "02", desc: "Casual for practice, Ranked for trophies, or Study for self-paced mastery with spaced repetition." },
            { Icon: TrophyIcon, title: "Climb the Ranks",     num: "03", desc: "Earn trophies, level up, and unlock exclusive cosmetics for your Inkling avatar." },
          ].map((step) => {
            const Icon = step.Icon;
            return (
            <div key={step.num} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              {/* Icon circle */}
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: DARK, border: `2px solid ${MINT}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "1.8rem",
                position: "relative",
              }}>
                <Icon className="w-7 h-7" color={MINT} />
                <span style={{
                  position: "absolute", bottom: "-8px", right: "-8px",
                  background: MINT, color: DARK,
                  fontSize: "0.58rem", fontWeight: 900,
                  borderRadius: "100px", padding: "2px 7px",
                }}>{step.num}</span>
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "white", marginBottom: "10px" }}>{step.title}</h3>
              <p style={{ fontSize: "0.88rem", color: MUTED, lineHeight: 1.65 }}>{step.desc}</p>
            </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: "52px", fontSize: "0.875rem", color: FAINT, fontStyle: "italic" }}>
          No subscription required. Play as much as you want, whenever you want.
        </p>

        {/* Meet Sir Inksworth */}
        <div style={{
          marginTop: "56px",
          maxWidth: "560px",
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          padding: "24px 28px",
          background: CARD,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
        }}>
          <div style={{ flexShrink: 0 }}>
            <InkAvatar config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }} size={80} />
          </div>
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 800, color: MINT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Meet Your League Guide</p>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: "white", marginBottom: "8px" }}>Sir Inksworth</p>
            <p style={{ fontSize: "0.9rem", color: MUTED, lineHeight: 1.6, fontStyle: "italic" }}>
              &ldquo;I will show you around so you can jump in fast and play with confidence.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          5. GAME MODES
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="game-modes" style={{ background: SURFACE, padding: "100px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <SLabel>GAME MODES</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "white" }}>
              Choose Your Challenge
            </h2>
          </div>

          <div className="modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              {
                title: "Casual Mode",
                accent: BLUE,
                glow:   "rgba(59,130,246,0.22)",
                avatar: { base: "droplet_01", color: BLUE, eyes: "eyes_03", accessory: "glasses_01", aura: "none" },
                sub:    "Practice Without Pressure",
                tags:   ["1v1 or 3v3 · 60-second rounds", "Vocabulary or Punctuation", "Grade 3 → AP Lit", "Party up with friends"],
                desc:   "Warm up with friends or solo. No rank impact — just pure practice.",
                cta:    "Play Casual →",
                href:   playHref,
              },
              {
                title: "Ranked Mode",
                accent: "#FBBF24",
                glow:   "rgba(251,191,36,0.18)",
                avatar: { base: "droplet_02", color: "#22C55E", eyes: "eyes_02", accessory: "crown_01", aura: "aura_glow_01" },
                icon:   TrophyIcon,
                sub:    "Prove Your Rank",
                tags:   ["Bronze → Emerald ladder", "Trophy-based matchmaking", "Win streak bonuses (up to 3×)", "Rank-exclusive rewards"],
                desc:   "Earn trophies, climb the ladder, and unlock exclusive cosmetics.",
                cta:    "View Leaderboard →",
                href:   playHref,
              },
              {
                title: "Study Mode",
                accent: "#A78BFA",
                glow:   "rgba(167,139,250,0.18)",
                avatar: { base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01", aura: "none" },
                sub:    "Learn at Your Own Pace",
                tags:   ["Spaced repetition", "10 tiers: Grade 3 → AP Lit", "Word mastery tracking (0–100%)", "Earn XP + Ink Drops"],
                desc:   "Self-paced practice with spaced repetition. No timer, no pressure.",
                cta:    "Start Studying →",
                href:   playHref,
              },
            ].map((mode) => (
              <div
                key={mode.title}
                className="mode-card"
                style={{
                  background: CARD,
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 12px 40px ${mode.glow}`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                {/* Colored top accent bar */}
                <div style={{ height: "4px", background: mode.accent, flexShrink: 0 }} />

                <div style={{ padding: "28px 24px 28px", flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
                  {/* Inkling avatar */}
                  <div style={{ height: "150px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <InkAvatar config={mode.avatar} size={120} />
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {"icon" in mode && mode.icon ? (() => { const Icon = mode.icon; return <Icon className="w-5 h-5 shrink-0" color={mode.accent} />; })() : null}
                    {mode.title}
                  </h3>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: mode.accent, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{mode.sub}</p>

                  {/* Feature tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
                    {mode.tags.map((tag) => (
                      <span key={tag} style={{
                        padding: "3px 10px",
                        borderRadius: "100px",
                        border: `1px solid ${mode.accent}30`,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: MUTED,
                        background: `${mode.accent}08`,
                      }}>{tag}</span>
                    ))}
                  </div>

                  <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.65, flex: 1, marginBottom: "20px" }}>
                    {mode.desc}
                  </p>

                  <Link
                    href={mode.href}
                    style={{ fontSize: "0.875rem", fontWeight: 800, color: mode.accent, textDecoration: "none", alignSelf: "flex-start" }}
                  >
                    {mode.cta}
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
      <section id="ranks" style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <SLabel>PROGRESSION</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "white", marginBottom: "16px" }}>
            Climb from Bronze to Emerald
          </h2>
          <p style={{ fontSize: "1rem", color: MUTED, maxWidth: "560px", margin: "0 auto", lineHeight: 1.72 }}>
            Win matches to earn trophies and rank up. New players get a placement match to find their starting tier. Build win streaks for up to 3× bonus trophies.
          </p>
        </div>

        {/* Progress bar — trophy ladder 0 → 2500 */}
        <div style={{ marginBottom: "40px", maxWidth: "700px", margin: "0 auto 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: FAINT }}>0</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: MUTED }}>Trophies</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: FAINT }}>2,500</span>
          </div>
          <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { tier: "Bronze" as RankTier, width: 4 },
              { tier: "Silver" as RankTier, width: 10 },
              { tier: "Gold" as RankTier, width: 26 },
              { tier: "Platinum" as RankTier, width: 20 },
              { tier: "Diamond" as RankTier, width: 32 },
              { tier: "Emerald" as RankTier, width: 8 },
            ].map(({ tier, width }) => (
              <div
                key={tier}
                style={{
                  width: `${width}%`,
                  backgroundColor: RANK_COLORS[tier],
                  opacity: 0.85,
                }}
                title={`${RANK_THRESHOLDS[tier]}+ trophies`}
              />
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "6px", fontSize: "0.65rem", color: FAINT }}>
            {RANK_TIERS.map((t, i) => (
              <span key={t} style={{ width: `${[4, 10, 26, 20, 32, 8][i]}%`, textAlign: "left" }}>
                {RANK_THRESHOLDS[t] >= 1000 ? `${RANK_THRESHOLDS[t] / 1000}K` : RANK_THRESHOLDS[t]}
              </span>
            ))}
          </div>
        </div>

        {/* Tier ladder */}
        <div style={{ position: "relative", padding: "24px 0 20px" }}>
          {/* Connecting gradient line */}
          <div
            className="tiers-line"
            style={{
              position: "absolute",
              top: "82px",
              left: "calc(8.33% + 12px)",
              right: "calc(8.33% + 12px)",
              height: "3px",
              background: "linear-gradient(90deg, #CD7F32, #C0C0C0, #D4AF37, #7DD3FC, #A78BFA, #10B981)",
              borderRadius: "4px",
              zIndex: 0,
            }}
          />

          <div className="tiers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", position: "relative", zIndex: 1 }}>
            {[
              { name: "Bronze" as RankTier, desc: "Start here" },
              { name: "Silver" as RankTier, desc: "Rising challenger" },
              { name: "Gold" as RankTier, desc: "Punctuation unlocked" },
              { name: "Platinum" as RankTier, desc: "Elite linguist" },
              { name: "Diamond" as RankTier, desc: "Legendary master" },
              { name: "Emerald" as RankTier, desc: "Ultimate champion" },
            ].map(({ name, desc }) => (
              <div key={name} className="tier-node" style={{ textAlign: "center" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: `${RANK_COLORS[name]}18`,
                  border: `2.5px solid ${RANK_COLORS[name]}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                  overflow: "hidden",
                }}>
                  <BigTierIcon tier={name} color={RANK_COLORS[name]} size={40} />
                </div>
                <p style={{ fontSize: "0.78rem", fontWeight: 800, color: RANK_COLORS[name], marginBottom: "4px" }}>{name}</p>
                <p style={{ fontSize: "0.68rem", color: FAINT }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Win streak callout */}
        <div style={{
          marginTop: "52px",
          background: CARD,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          padding: "22px 28px",
          display: "flex", alignItems: "flex-start", gap: "14px",
          maxWidth: "600px",
          margin: "52px auto 0",
        }}>
          <div style={{ flexShrink: 0, marginTop: "2px" }}>
            <FlameIcon className="w-6 h-6" color="#F59E0B" />
          </div>
          <div>
            <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "white", marginBottom: "6px" }}>Win Streak Bonus</p>
            <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.65 }}>
              Win 10 games in a row to unlock the full 3× trophy multiplier. Every win counts — keep the streak alive!
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          7. VOCABULARY SCOPE
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="vocabulary" style={{ background: SURFACE, padding: "100px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            className="vocab-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}
          >
            {/* Left: tier pills */}
            <div>
              <SLabel>CURRICULUM</SLabel>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "white", marginBottom: "16px" }}>
                Vocabulary Built for Every Level
              </h2>
              <p style={{ fontSize: "1rem", color: MUTED, lineHeight: 1.72, marginBottom: "32px" }}>
                From Grade 3 foundations through AP Literature. Aligned with College Board Pre-AP and AP English. Context clues, definitions, synonyms, rhetoric, and more.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "Grade 3",        ap: false },
                  { label: "Grade 4",        ap: false },
                  { label: "Grade 5",        ap: false },
                  { label: "Grade 6",        ap: false },
                  { label: "Grade 7",        ap: false },
                  { label: "Pre-AP English 1", ap: false },
                  { label: "Pre-AP English 2", ap: false },
                  { label: "English 3", ap: false },
                  { label: "AP Language",    ap: true },
                  { label: "AP Literature",  ap: true },
                ].map((t) => (
                  <span key={t.label} style={{
                    padding: "5px 14px",
                    borderRadius: "100px",
                    border: `1.5px solid ${t.ap ? MINT : "rgba(255,255,255,0.14)"}`,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: t.ap ? MINT : MUTED,
                    background: t.ap ? `${MINT}0E` : "transparent",
                  }}>
                    {t.label}
                  </span>
                ))}
              </div>

              <p style={{ marginTop: "24px", fontSize: "0.8rem", color: FAINT, fontStyle: "italic" }}>
                New word sets added each season.
              </p>
            </div>

            {/* Right: skill tag cloud */}
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 800, color: FAINT, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "20px" }}>
                Skill types covered
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {[
                  ["Definitions",       BLUE],
                  ["Context Clues",     MINT],
                  ["Synonyms",          "#A78BFA"],
                  ["Antonyms",          "#F97316"],
                  ["Word Forms",        "#EC4899"],
                  ["Theme & Craft",     BLUE],
                  ["Story Elements",    MINT],
                  ["Figurative Language","#A78BFA"],
                  ["Rhetoric",          "#F97316"],
                  ["Argument",          BLUE],
                  ["Inference",         MINT],
                  ["Author's Purpose",  "#A78BFA"],
                ].map(([skill, color]) => (
                  <span key={skill} style={{
                    padding: "6px 16px",
                    borderRadius: "100px",
                    border: `1px solid ${color}50`,
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    color: color as string,
                    background: `${color}10`,
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
      <section id="inklings" style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <SLabel>YOUR INKLING</SLabel>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "white", marginBottom: "16px" }}>
            Make It Yours
          </h2>
          <p style={{ fontSize: "1rem", color: MUTED, maxWidth: "500px", margin: "0 auto", lineHeight: 1.72 }}>
            Customize your Inkling avatar with shapes, colors, eyes, gear, and auras. Earn Ink Drops in-game and spend them in the Ink Shop. Rank-exclusive cosmetics unlock as you climb.
          </p>
        </div>

        <div className="cosm-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "28px", alignItems: "center" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { Icon: CircleIcon, title: "Shapes",  desc: "Classic, Blobby, Pointed, Ghost, Splat — 5 droplet shapes." },
              { Icon: EyeIcon, title: "Eyes",    desc: "8 styles — Friendly, Determined, Sparkle, Cool, and more." },
              { Icon: PaletteIcon, title: "Colors",  desc: "20+ colors including rank-exclusive Bronze through Emerald." },
            ].map((cat) => {
              const Icon = cat.Icon;
              return (
              <div key={cat.title} className="cosm-card" style={{ background: CARD, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ flexShrink: 0, lineHeight: 1.2, display: "flex", alignItems: "center", color: MINT }}>
                  <Icon className="w-6 h-6" color={MINT} />
                </span>
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "white", marginBottom: "2px" }}>{cat.title}</p>
                  <p style={{ fontSize: "0.76rem", color: MUTED }}>{cat.desc}</p>
                </div>
              </div>
            );
            })}
          </div>

          {/* Center: large Inkling */}
          <div className="cosm-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <InkAvatar config={{ base: "droplet_02", color: "#D4AF37", eyes: "eyes_05", accessory: "crown_01", aura: "aura_glow_01" }} size={200} />
            <span style={{
              display: "inline-block",
              padding: "5px 14px",
              borderRadius: "100px",
              background: DARK,
              border: `1px solid ${MINT}`,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: MINT,
              textAlign: "center",
            }}>
              Rank-exclusive cosmetics unlock as you climb
            </span>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { Icon: CrownIcon, title: "Gear",       desc: "Crown, Wizard Hat, Glasses, Sword, Shield — medieval, fancy, and track collections." },
              { Icon: SparkIcon, title: "Auras",      desc: "Glow effects — unlock via level rewards or purchase packs." },
              { Icon: InkDropIcon, title: "Ink Drops",  desc: "Earned in every game. Spend in the Ink Shop or claim daily rewards." },
            ].map((cat) => {
              const Icon = cat.Icon;
              return (
              <div key={cat.title} className="cosm-card" style={{ background: CARD, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ flexShrink: 0, lineHeight: 1.2, display: "flex", alignItems: "center", color: MINT }}>
                  <Icon className="w-6 h-6" color={MINT} />
                </span>
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "white", marginBottom: "2px" }}>{cat.title}</p>
                  <p style={{ fontSize: "0.76rem", color: MUTED }}>{cat.desc}</p>
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
      <section id="community" style={{ background: SURFACE, padding: "100px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <SLabel>COMMUNITY</SLabel>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "white" }}>
              What Players Are Saying
            </h2>
          </div>

          <div className="testimonials" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              { quote: "I actually ask to play during free time now. It's the only vocab game I like.", name: "Philip", role: "Diamond-ranked student" },
              { quote: "I use Lexicon League for warm-ups and review. The ranked mode keeps my 8th graders engaged and competitive.", name: "Ms. Chen", role: "8th Grade ELA Teacher" },
              { quote: "My kid went from dreading vocab to asking for 'one more round.' The Inklings are adorable.", name: "Parent", role: "Parent" },
            ].map((t, i) => (
              <div
                key={i}
                className="tcard"
                style={{
                  background: CARD,
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderTop: `3px solid ${MINT}`,
                  borderRadius: "14px",
                  padding: "28px 24px",
                }}
              >
                <div style={{ fontSize: "3rem", color: MINT, lineHeight: 0.9, marginBottom: "16px", fontFamily: "Georgia, serif" }}>&ldquo;</div>
                <p style={{ fontSize: "0.95rem", color: MUTED, lineHeight: 1.72, marginBottom: "24px", fontStyle: "italic" }}>
                  {t.quote}
                </p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "white", marginBottom: "2px" }}>{t.name}</p>
                  <p style={{ fontSize: "0.78rem", color: MINT, fontWeight: 600, fontStyle: "italic" }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          10. COMING SOON — STORY MODE & CLASSROOM MODE
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="story-mode" style={{ padding: "80px 24px" }}>
        <div
          className="story-grid"
          style={{
            background: "linear-gradient(135deg, rgba(190, 18, 60, 0.12) 0%, rgba(15, 23, 42, 0.6) 30%, rgba(14, 165, 233, 0.12) 100%)",
            border: "2px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            maxWidth: "1100px",
            margin: "0 auto",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 6px 24px rgba(190, 18, 60, 0.1), 0 6px 24px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Ambient glows */}
          <div style={{ position: "absolute", top: "50%", left: "15%", transform: "translate(-50%, -50%)", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(190, 18, 60, 0.15) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", right: "15%", transform: "translate(50%, -50%)", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 65%)", pointerEvents: "none" }} />

          <div className="story-inner" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "48px", alignItems: "center", padding: "72px 60px", position: "relative", zIndex: 1 }}>
            {/* Left: text */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 900, color: "white", letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(90deg, #9F1239 0%, #0369A1 100%)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>Coming Soon</span>
              </div>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 900, color: "white", marginBottom: "16px", lineHeight: 1.08 }}>
                Story Mode & Classroom Mode
              </h2>
              <p style={{ fontSize: "1rem", color: MUTED, lineHeight: 1.72, marginBottom: "20px" }}>
                <strong style={{ color: "#BE123C" }}>Story Mode:</strong> Chapters, boss battles, and exclusive loot. A narrative adventure through the world of words. Defeat vocab villains and unlock story rewards.
              </p>
              <p style={{ fontSize: "1rem", color: MUTED, lineHeight: 1.72 }}>
                <strong style={{ color: "#0284C7" }}>Classroom Mode:</strong> Built for teachers. Host live sessions with 20+ students, assign vocabulary and punctuation challenges, and track class progress in real time.
              </p>
            </div>

            {/* Right: bigger Inklings with settings */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "24px", flexShrink: 0 }}>
              {/* Story Mode — adventure setting */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  position: "relative",
                  padding: "24px 28px 20px",
                  background: "linear-gradient(180deg, rgba(190, 18, 60, 0.15) 0%, rgba(30, 30, 50, 0.4) 60%)",
                  borderRadius: "16px",
                  border: "1px solid rgba(190, 18, 60, 0.25)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(190, 18, 60, 0.15)",
                }}>
                  {/* Book/scroll accent */}
                  <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", width: "60%", height: "6px", background: "linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.4), transparent)", borderRadius: "2px", opacity: 0.8 }} />
                  <InkAvatar config={{ base: "droplet_01", color: "#DC2626", eyes: "eyes_02", accessory: "none", aura: "none" }} size={160} />
                </div>
                <span style={{ marginTop: "8px", fontSize: "0.7rem", fontWeight: 700, color: "#BE123C" }}>Story</span>
              </div>
              {/* Classroom Mode — desk setting */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  position: "relative",
                  padding: "24px 28px 20px",
                  background: "linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(20, 35, 55, 0.4) 60%)",
                  borderRadius: "16px",
                  border: "1px solid rgba(14, 165, 233, 0.25)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(14, 165, 233, 0.15)",
                }}>
                  {/* Chalkboard line accent */}
                  <div style={{ position: "absolute", bottom: "14px", left: "12px", right: "12px", height: "4px", background: "linear-gradient(90deg, rgba(14, 165, 233, 0.3), rgba(14, 165, 233, 0.5), rgba(14, 165, 233, 0.3))", borderRadius: "2px", opacity: 0.7 }} />
                  <InkAvatar config={{ base: "droplet_01", color: "#0EA5E9", eyes: "eyes_03", accessory: "quill_01", aura: "none" }} size={160} />
                </div>
                <span style={{ marginTop: "8px", fontSize: "0.7rem", fontWeight: 700, color: "#0284C7" }}>Classroom</span>
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
          <div style={{ position: "absolute", top: "-60px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-80px", right: "38%", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          {/* Text */}
          <div style={{ position: "relative", zIndex: 1, maxWidth: "540px" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "white", marginBottom: "16px", lineHeight: 1.08 }}>
              Ready to Level Up Your Words?
            </h2>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.82)", marginBottom: "36px", lineHeight: 1.65 }}>
              Join free. No subscription required. Start playing in seconds.
            </p>
            <Link
              href={playHref}
              style={{
                display: "inline-block",
                padding: "16px 44px",
                borderRadius: "12px",
                background: BLUE,
                color: "white",
                fontSize: "1.1rem",
                fontWeight: 900,
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Play Free Now
            </Link>
            <p style={{ marginTop: "14px", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
              Guest mode available. No credit card needed.
            </p>
          </div>

          {/* Sir Inksworth — League Guide */}
          <div className="cta-img" style={{ flexShrink: 0, position: "relative", zIndex: 1, textAlign: "center" }}>
            <InkAvatar config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }} size={200} />
            <p style={{ marginTop: "12px", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Sir Inksworth</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          12. FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer id="footer" style={{ background: SURFACE, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Main footer grid */}
        <div
          className="footer-grid"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "64px 24px 48px",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            gap: "48px",
          }}
        >
          {/* Brand column */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: CARD, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", padding: "4px" }}>
                <LogoIcon className="w-full h-full" style={{ minWidth: "24px", minHeight: "24px" }} />
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "white" }}>Lexicon<span style={{ color: BLUE }}>League</span></span>
            </div>

            <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.65, marginBottom: "24px" }}>
              Words are your superpower. Vocabulary and punctuation for Grades 4–8 and beyond.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { label: "Discord",   d: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" },
                { label: "X / Twitter", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "Instagram",  d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  title={s.label}
                  style={{
                    width: "36px", height: "36px",
                    borderRadius: "8px",
                    background: CARD,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${MINT}60`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill={MUTED}>
                    <path d={s.d} />
                  </svg>
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
                  { label: "Ranked Mode",   href: "/ranked" },
                  { label: "Study Mode",    href: "/study" },
                  { label: "Leaderboard",   href: "/ranked" },
                ],
              },
              {
                title: "Progress",
                links: [
                  { label: "Rank Tiers",    href: "/ranked" },
                  { label: "Ink Shop",      href: "/shop" },
                  { label: "Ink Locker",    href: "/locker" },
                  { label: "Daily Rewards", href: "/shop" },
                ],
              },
              {
                title: "Learn More",
                links: [
                  { label: "About",     href: "/#hero" },
                  { label: "FAQ",       href: "/#how-it-works" },
                  { label: "Blog",      href: "#" },
                  { label: "Careers",   href: "#" },
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
              <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>
                {col.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map((link, i) => (
                  <Link
                    key={`${col.title}-${i}`}
                    href={link.href}
                    style={{
                      fontSize: "0.875rem",
                      color: MUTED,
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
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
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <p style={{ fontSize: "0.8rem", color: FAINT }}>
            © 2025 Lexicon League · All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: CARD, border: "1px solid rgba(255,255,255,0.1)" }}>
              <InkAvatar config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }} size={28} />
            </div>
            <span style={{ fontSize: "0.75rem", color: FAINT }}>Built with Sir Inksworth&apos;s blessing</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
