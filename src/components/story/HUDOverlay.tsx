"use client";

interface HUDOverlayProps {
  hearts: number;
  maxHearts: number;
  lexicoins: number;
  openedGates: number;
  totalGates: number;
  healthOnly?: boolean;
}

export default function HUDOverlay({ hearts, maxHearts, lexicoins, openedGates, totalGates, healthOnly=false }: HUDOverlayProps) {
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
      <div role="status" aria-label={`Health: ${hearts} of ${maxHearts}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#10242be8', padding: '8px 10px', borderRadius: 8 }}>
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart key={i} filled={i < hearts} />
        ))}
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

      {/* Compact chapter progress: filled runes replace the old text label. */}
      {!healthOnly && <div
        aria-label={`${openedGates} of ${totalGates} Word Seals restored`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 9px',
          borderRadius: '999px',
          border: '1px solid rgba(244, 201, 107, 0.35)',
          background: 'rgba(8, 24, 32, 0.78)',
          color: '#f8e7b3',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {Array.from({ length: totalGates }).map((_, index) => (
          <span
            key={index}
            style={{
              width: 10,
              height: 10,
              display: 'block',
              transform: 'rotate(45deg)',
              border: `1px solid ${index < openedGates ? '#f4c96b' : '#64748b'}`,
              background: index < openedGates ? '#58e0b0' : 'rgba(30, 41, 59, 0.8)',
              boxShadow: index < openedGates ? '0 0 8px rgba(88, 224, 176, 0.7)' : 'none',
            }}
          />
        ))}
      </div>}
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
