"use client";

interface HUDOverlayProps {
  hearts: number;
  maxHearts: number;
  lexicoins: number;
}

export default function HUDOverlay({ hearts, maxHearts, lexicoins }: HUDOverlayProps) {
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
        zIndex: 20,
      }}
    >
      {/* Hearts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart key={i} filled={i < hearts} />
        ))}
      </div>

      {/* Lexicoins */}
      <div
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
      </div>
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <path
        d="M11 18.5C11 18.5 1.5 12.5 1.5 6.5C1.5 4.01 3.51 2 6 2C7.91 2 9.55 3.13 10.37 4.76C10.61 5.23 11.39 5.23 11.63 4.76C12.45 3.13 14.09 2 16 2C18.49 2 20.5 4.01 20.5 6.5C20.5 12.5 11 18.5 11 18.5Z"
        fill={filled ? '#ef4444' : '#1e293b'}
        stroke={filled ? '#dc2626' : '#334155'}
        strokeWidth="1.5"
      />
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
