"use client";

import { useTheme } from "@/context/ThemeContext";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme, light } = useTheme();
  const btnClass = light
    ? "bg-[#F1F5F9] border-[#E2E8F0] hover:border-[#CBD5E1] text-[#64748B]"
    : "bg-white/5 border-white/10 hover:border-white/20 text-white/60";

  return (
    <button
      onClick={toggleTheme}
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all ${btnClass}`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <SunIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
    </button>
  );
}
