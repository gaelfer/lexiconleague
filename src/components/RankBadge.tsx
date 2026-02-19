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
  if (tier === "Bronze" || tier === "Silver") {
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
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" {...common} />
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

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sz.container}`}
      style={{
        color,
        border: `2px solid ${color}40`,
        background: `${color}15`,
      }}
    >
      <RankIcon tier={tier} className={sz.icon} />
      <span>{tier}</span>
      {showTrophies && trophies !== undefined && (
        <span className="opacity-80 font-semibold">· {trophies}</span>
      )}
    </span>
  );
}
