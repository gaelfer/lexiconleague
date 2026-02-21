"use client";

import { RankTier, RANK_COLORS } from "@/types";

interface RankBadgeProps {
  tier: RankTier;
  trophies?: number;
  size?: "sm" | "md" | "lg";
  showTrophies?: boolean;
}

const SIZE_CLASSES = {
  sm: { container: "px-2.5 py-1 text-xs gap-1.5", icon: "w-3.5 h-3.5" },
  md: { container: "px-3 py-1.5 text-sm gap-2", icon: "w-4 h-4" },
  lg: { container: "px-4 py-2 text-base gap-2.5", icon: "w-5 h-5" },
};

function RankIcon({ tier, className }: { tier: RankTier; className: string }) {
  const color = RANK_COLORS[tier];
  const common = { stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  if (tier === "Bronze") {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill={`${color}35`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6L16.5 9v6Q12 18.75 7.5 15V9L12 6Z" fill={`${color}30`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 9V15" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (tier === "Silver") {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" {...common} />
        <path d="M12 8v4l2 2" {...common} />
      </svg>
    );
  }
  if (tier === "Gold") {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M8 21h8M12 17v4M17 4H7l-2 5c0 3.87 3.13 7 7 7s7-3.13 7-7L17 4z" {...common} />
        <path d="M5 9H3l-1 4h4M19 9h2l1 4h-4" {...common} />
      </svg>
    );
  }
  if (tier === "Platinum") {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...common} />
      </svg>
    );
  }
  if (tier === "Emerald") {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M12 2l3 9 6 2-6 2-3 9-3-9-6-2 6-2 3-9z" {...common} />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 3.75L16.5 8.25L18 12L16.5 15.75L12 20.25L7.5 15.75L6 12L7.5 8.25L12 3.75Z" fill={`${color}30`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function RankBadge({
  tier,
  trophies,
  size = "md",
  showTrophies = false,
}: RankBadgeProps) {
  const color = RANK_COLORS[tier];
  const sz = SIZE_CLASSES[size];

  const isBronze = tier === "Bronze";
  return (
    <span
      className={`inline-flex items-center font-bold ${sz.container} ${isBronze ? "rounded-2xl shadow-[0_2px_8px_rgba(205,127,50,0.35)]" : "rounded-full"}`}
      style={{
        color,
        border: isBronze ? `2.5px solid ${color}` : `2px solid ${color}40`,
        background: isBronze ? `linear-gradient(135deg, ${color}30 0%, ${color}15 50%, ${color}25 100%)` : `${color}15`,
        boxShadow: isBronze ? `inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(205,127,50,0.25)` : undefined,
      }}
    >
      <RankIcon tier={tier} className={sz.icon} />
      <span className={isBronze ? "font-extrabold tracking-wide" : ""}>{tier}</span>
      {showTrophies && trophies !== undefined && (
        <span className="opacity-80 font-semibold">· {trophies}</span>
      )}
    </span>
  );
}
