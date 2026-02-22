"use client";

import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type LevelUpBurstProps = {
  level: number;
};

const Particle: React.FC<{
  angleDeg: number;
  distance: number;
  delay: number;
  color: string;
  size: number;
}> = ({ angleDeg, distance, delay, color, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    durationInFrames: 26,
    config: { damping: 200 },
  });
  const fade = interpolate(frame, [delay + 12, delay + 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        borderRadius: "999px",
        background: color,
        opacity: fade,
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translateY(${-distance * progress}px)`,
      }}
    />
  );
};

export const LevelUpBurst: React.FC<LevelUpBurstProps> = ({ level }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame,
    fps,
    durationInFrames: 18,
    config: { damping: 200 },
  });

  const ring = interpolate(frame, [0, 30], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const ringOpacity = interpolate(frame, [0, 10, 30], [0.9, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineLift = interpolate(frame, [0, 16], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: ring,
          height: ring,
          borderRadius: "50%",
          border: "3px solid #8B5CF6",
          opacity: ringOpacity,
          transform: "translate(-50%, -50%)",
        }}
      />

      {[...Array(24)].map((_, i) => {
        const angle = i * 15;
        const color = i % 3 === 0 ? "#8B5CF6" : i % 3 === 1 ? "#34D399" : "#3B82F6";
        return (
          <Particle
            key={i}
            angleDeg={angle}
            distance={180 + (i % 5) * 24}
            delay={i % 6}
            color={color}
            size={8 + (i % 4) * 2}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(pop, [0, 1], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          textAlign: "center",
          textShadow: "0 10px 35px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            color: "#8B5CF6",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: 1,
            transform: `translateY(${headlineLift}px)`,
            opacity: interpolate(frame, [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          LEVEL UP
        </div>
        <div
          style={{
            color: "#F8FAFC",
            fontSize: 44,
            fontWeight: 700,
            marginTop: 8,
            opacity: interpolate(frame, [4, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Level {level}
        </div>
      </div>
    </AbsoluteFill>
  );
};
