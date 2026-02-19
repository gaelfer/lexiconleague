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

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      {/* Aura layer — colored via mask */}
      {c.aura !== "none" && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundColor: c.color,
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

      {/* Eyes overlay */}
      <div className="absolute" style={{ top: "10%", left: "10%", right: "10%", bottom: "10%" }}>
        <img
          src={`/ink/eyes/${c.eyes}.svg`}
          alt=""
          className="w-full h-full"
          draggable={false}
        />
      </div>

      {/* Accessory overlay */}
      {c.accessory !== "none" && (
        <div className="absolute" style={{ top: "10%", left: "10%", right: "10%", bottom: "10%" }}>
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
