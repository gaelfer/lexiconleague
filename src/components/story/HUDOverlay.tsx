"use client";

interface HUDOverlayProps {
  hearts: number;
  maxHearts: number;
  lexicoins: number;
  healthOnly?: boolean;
  bonusHeart?: number;
}

export default function HUDOverlay({ hearts, maxHearts, lexicoins, healthOnly=false, bonusHeart=0 }: HUDOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        pointerEvents: 'none',
        zIndex: 500,
      }}
    >
      {/* Hearts */}
      <div role="status" aria-label={`Health: ${hearts} of ${maxHearts}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#10242be8', padding: '8px 10px', borderRadius: 8 }}>
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart key={i} filled={Math.max(0,Math.min(1,hearts-i))} />
        ))}
        {bonusHeart>0&&<span aria-label="Yellow bonus heart"><Heart filled={bonusHeart} yellow/></span>}
      </div>

      {/* Lexicoins */}
      {!healthOnly && <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#fbbf24',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <CoinIcon />
        <span>{lexicoins}</span>
      </div>}

    </div>
  );
}

function Heart({ filled, yellow=false }: { filled: number; yellow?: boolean }) {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <path
        d="M11 18.5C11 18.5 1.5 12.5 1.5 6.5C1.5 4.01 3.51 2 6 2C7.91 2 9.55 3.13 10.37 4.76C10.61 5.23 11.39 5.23 11.63 4.76C12.45 3.13 14.09 2 16 2C18.49 2 20.5 4.01 20.5 6.5C20.5 12.5 11 18.5 11 18.5Z"
        fill={filled ? (yellow?'#f4ce55':'#ef4444') : '#1e293b'}
        stroke={filled ? (yellow?'#b68b27':'#dc2626') : '#334155'}
        strokeWidth="1.5"
      />
      {filled===.5&&<path d="M11 18.5V5.1C11.24 5.23 11.39 5.23 11.63 4.76C12.45 3.13 14.09 2 16 2C18.49 2 20.5 4.01 20.5 6.5C20.5 12.5 11 18.5 11 18.5Z" fill="#1e293b"/>}
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <circle cx="6" cy="6" r="3" fill="#fde68a" />
    </svg>
  );
}
