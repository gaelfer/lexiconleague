/** Flame icon — Remix Icon fire-fill (Apache 2.0) */
export default function FlameIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 23c-4.111 0-7.5-3.589-7.5-8 0-2.5 1.5-5 3-7.5 1.5 2.5 2 4 2 4 0-1.5-.5-3-1-4.5-.5-1.5-1-3-1-4.5 0-2.5 1.5-4.5 4-4.5 2 0 3 1.5 3.5 2.5.5-1.5 2-2.5 3.5-2.5 2.5 0 4 2 4 4.5 0 1.5-.5 3-1 4.5-.5 1.5-1 3-1 4.5 0 0 2 4 2 4 1.5-2.5 3-5 3-7.5 0 4.411-3.389 8-7.5 8z" />
    </svg>
  );
}
