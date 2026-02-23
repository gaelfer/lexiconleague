"use client";

import { useTheme } from "@/context/ThemeContext";

const AMBER = "#F59E0B";
const GOLD = "#FBBF24";

export default function TeacherPortalLoader() {
  const { light } = useTheme();
  const bg = light ? "bg-[#FAFAF9]" : "bg-[#0A0E17]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center px-6 ${bg} relative overflow-hidden`}>
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${light ? "#0F172A" : "#fff"} 1px, transparent 1px),
              linear-gradient(90deg, ${light ? "#0F172A" : "#fff"} 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl ${
            light ? "bg-amber-200/20" : "bg-amber-500/8"
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated graduation cap icon */}
        <div className="relative mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center animate-teacher-pulse"
            style={{
              background: `linear-gradient(135deg, ${GOLD}20 0%, ${AMBER}30 100%)`,
              border: `2px solid ${AMBER}40`,
            }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: AMBER }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 flex items-center justify-center animate-teacher-spin">
            <span
              className="absolute w-2 h-2 rounded-full"
              style={{ background: AMBER, top: "0%", left: "50%", transform: "translateX(-50%)" }}
            />
            <span
              className="absolute w-1.5 h-1.5 rounded-full opacity-70"
              style={{ background: GOLD, top: "50%", right: "0%", transform: "translateY(-50%)" }}
            />
            <span
              className="absolute w-1.5 h-1.5 rounded-full opacity-70"
              style={{ background: GOLD, bottom: "0%", left: "50%", transform: "translateX(-50%)" }}
            />
            <span
              className="absolute w-1.5 h-1.5 rounded-full opacity-70"
              style={{ background: GOLD, top: "50%", left: "0%", transform: "translateY(-50%)" }}
            />
          </div>
        </div>

        <h2
          className={`text-xl font-bold ${text}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Loading Teacher Portal
        </h2>
        <p className={`text-sm mt-2 ${textMuted}`}>
          Preparing your classroom hub…
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-[200px] h-1.5 rounded-full mt-6 overflow-hidden bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
              animation: "teacher-loader-shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </main>
  );
}
