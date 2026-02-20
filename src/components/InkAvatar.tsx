"use client";

import { InkAvatarConfig, DEFAULT_AVATAR_CONFIG } from "@/types";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

const SIZE_MAP: Record<string, number> = {
  xs: 32,
  sm: 48,
  md: 72,
  lg: 120,
  xl: 200,
};

/**
 * Per-body-shape vertical offsets (%) for eyes and accessories.
 * Each shape has its "face" at a different height, so overlays need shifting.
 */
const BODY_OFFSETS: Record<string, { eyesY: number; accY: number }> = {
  droplet_01: { eyesY: 0,  accY: 0  },   // Classic teardrop — baseline
  droplet_02: { eyesY: -6, accY: -8 },   // Blobby — face higher in the round body
  droplet_03: { eyesY: -2, accY: -4 },   // Pointed — slight upward shift
  droplet_04: { eyesY: -8, accY: -12 },  // Ghost — tall body, face much higher
  droplet_05: { eyesY: -4, accY: -6 },   // Splat — star centered, shift up a bit
};

interface InkAvatarProps {
  config?: InkAvatarConfig;
  size?: AvatarSize;
  className?: string;
}

export default function InkAvatar({
  config,
  size = "md",
  className = "",
}: InkAvatarProps) {
  const c = { ...DEFAULT_AVATAR_CONFIG, ...config };
  const px = typeof size === "number" ? size : SIZE_MAP[size] ?? 72;
  const offsets = BODY_OFFSETS[c.base] ?? { eyesY: 0, accY: 0 };

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      {/* Aura layer — uses aura_color if set, otherwise body color */}
      {c.aura !== "none" && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundColor: c.aura_color || c.color,
            WebkitMaskImage: `url(/ink/auras/${c.aura}.svg)`,
            maskImage: `url(/ink/auras/${c.aura}.svg)`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            opacity: 0.5,
          }}
        />
      )}

      {/* Base droplet — colored via mask */}
      <div
        className="absolute"
        style={{
          top: "10%",
          left: "10%",
          right: "10%",
          bottom: "10%",
          backgroundColor: c.color,
          WebkitMaskImage: `url(/ink/base/${c.base}.svg)`,
          maskImage: `url(/ink/base/${c.base}.svg)`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          filter: `drop-shadow(0 2px 6px ${c.color}40)`,
        }}
      />

      {/* Eyes overlay — shifted per body shape */}
      <div
        className="absolute"
        style={{
          top: "10%",
          left: "10%",
          right: "10%",
          bottom: "10%",
          transform: offsets.eyesY ? `translateY(${offsets.eyesY}%)` : undefined,
        }}
      >
        <img
          src={`/ink/eyes/${c.eyes}.svg`}
          alt=""
          className="w-full h-full"
          draggable={false}
        />
      </div>

      {/* Accessory overlay — shifted per body shape */}
      {c.accessory !== "none" && (
        <div
          className="absolute"
          style={{
            top: "10%",
            left: "10%",
            right: "10%",
            bottom: "10%",
            transform: offsets.accY ? `translateY(${offsets.accY}%)` : undefined,
          }}
        >
          <img
            src={`/ink/accessories/${c.accessory}.svg`}
            alt=""
            className="w-full h-full"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
