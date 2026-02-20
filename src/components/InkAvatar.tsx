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
 * Per-body-shape offsets for eyes and accessories.
 * eyesY/accY: vertical shift (%).
 * accX: horizontal shift (%) — for wider/narrower bodies.
 * accScale: uniform scale — stretches accessories to match body width.
 */
const BODY_OFFSETS: Record<string, { eyesY: number; accY: number; accX: number; accScale: number }> = {
  droplet_01: { eyesY: 0,  accY: 0,   accX: 0,  accScale: 1    },  // Classic teardrop — baseline
  droplet_02: { eyesY: -6, accY: -8,  accX: 0,  accScale: 1.08 },  // Blobby — wider, scale up accessories
  droplet_03: { eyesY: -2, accY: -4,  accX: 0,  accScale: 0.95 },  // Pointed — narrower top, scale down slightly
  droplet_04: { eyesY: -8, accY: -12, accX: 0,  accScale: 1.02 },  // Ghost — similar width, shift up a lot
  droplet_05: { eyesY: -4, accY: -6,  accX: 0,  accScale: 1.05 },  // Splat — wide points, slight scale up
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
  const offsets = BODY_OFFSETS[c.base] ?? { eyesY: 0, accY: 0, accX: 0, accScale: 1 };

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

      {/* Accessory overlays — up to 2 slots, shifted and scaled per body shape */}
      {[c.accessory, c.accessory2 ?? "none"].map((accId, idx) => {
        if (accId === "none") return null;
        const parts: string[] = [];
        if (offsets.accX) parts.push(`translateX(${offsets.accX}%)`);
        if (offsets.accY) parts.push(`translateY(${offsets.accY}%)`);
        if (offsets.accScale && offsets.accScale !== 1) parts.push(`scale(${offsets.accScale})`);
        const transform = parts.length > 0 ? parts.join(" ") : undefined;
        return (
          <div
            key={`acc-${idx}`}
            className="absolute"
            style={{
              top: "10%",
              left: "10%",
              right: "10%",
              bottom: "10%",
              transform,
            }}
          >
            <img
              src={`/ink/accessories/${accId}.svg`}
              alt=""
              className="w-full h-full"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}
