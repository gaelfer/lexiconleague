export default function TrophyIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M17 4H7l-2 5c0 3.87 3.13 7 7 7s7-3.13 7-7L17 4z" />
      <path d="M5 9H3l-1 4h4M19 9h2l1 4h-4" />
      <path d="M12 11V4" />
      <path d="M9 4h6" />
    </svg>
  );
}
