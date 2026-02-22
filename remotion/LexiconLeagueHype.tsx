import {loadFont as loadOutfit} from "@remotion/google-fonts/Outfit";
import {loadFont as loadPlayfairDisplay} from "@remotion/google-fonts/PlayfairDisplay";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BLUE, CARD, DARK, FAINT, MINT, MUTED, SURFACE} from "../src/lib/design-tokens";

const {fontFamily: bodyFont} = loadOutfit("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

const {fontFamily: displayFont} = loadPlayfairDisplay("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type LexiconLeagueHypeProps = {
  headline: string;
  cta: string;
  streakDays: number;
  winRate: number;
  focusWords: string[];
};

const Orb: React.FC<{delay: number; x: number; y: number; size: number; hue: "mint" | "blue"}> = ({
  delay,
  x,
  y,
  size,
  hue,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
  });
  const drift = Math.sin((frame + delay) / 25) * 24;
  const opacity = interpolate(progress, [0, 1], [0, 0.36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + drift,
        width: size,
        height: size,
        borderRadius: "999px",
        background:
          hue === "mint"
            ? "radial-gradient(circle at 35% 35%, rgba(52,211,153,0.95), rgba(52,211,153,0.25) 45%, rgba(52,211,153,0) 100%)"
            : "radial-gradient(circle at 35% 35%, rgba(59,130,246,0.95), rgba(59,130,246,0.25) 45%, rgba(59,130,246,0) 100%)",
        opacity,
        transform: `scale(${interpolate(progress, [0, 1], [0.4, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })})`,
      }}
    />
  );
};

const StatPill: React.FC<{
  label: string;
  value: string;
  delay: number;
}> = ({label, value, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entry = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
  });

  return (
    <div
      style={{
        border: `1px solid ${FAINT}`,
        borderRadius: 999,
        padding: "22px 34px",
        background: "rgba(8, 15, 26, 0.72)",
        backdropFilter: "blur(8px)",
        opacity: interpolate(entry, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(entry, [0, 1], [36, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px)`,
      }}
    >
      <div style={{fontFamily: bodyFont, color: MUTED, fontSize: 24, letterSpacing: 1.1}}>
        {label}
      </div>
      <div style={{fontFamily: bodyFont, color: "#F8FAFC", fontWeight: 700, fontSize: 50}}>
        {value}
      </div>
    </div>
  );
};

export const LexiconLeagueHype: React.FC<LexiconLeagueHypeProps> = ({
  headline,
  cta,
  streakDays,
  winRate,
  focusWords,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: {damping: 200},
  });
  const outro = spring({
    frame: frame - (durationInFrames - 40),
    fps,
    durationInFrames: 35,
    config: {damping: 200},
  });

  const cameraLift = interpolate(frame, [0, durationInFrames], [16, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const streakCount = Math.round(
    interpolate(frame, [140, 220], [0, streakDays], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.exp),
    }),
  );
  const rateCount = Math.round(
    interpolate(frame, [150, 235], [0, winRate], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.exp),
    }),
  );

  const compositeOpacity = interpolate(outro, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const compositeScale = interpolate(outro, [0, 1], [1, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${SURFACE} 0%, ${DARK} 54%, #071525 100%)`,
        overflow: "hidden",
      }}
    >
      <Orb delay={0} x={-80} y={180} size={480} hue="mint" />
      <Orb delay={12} x={680} y={340} size={430} hue="blue" />
      <Orb delay={25} x={360} y={1230} size={620} hue="mint" />

      <AbsoluteFill
        style={{
          transform: `translateY(${cameraLift}px) scale(${compositeScale})`,
          opacity: compositeOpacity,
          padding: "120px 76px 96px",
        }}
      >
        <div
          style={{
            fontFamily: bodyFont,
            color: MINT,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2.8,
            textTransform: "uppercase",
            opacity: interpolate(entry, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Lexicon League
        </div>

        <h1
          style={{
            fontFamily: displayFont,
            color: "#F8FAFC",
            fontSize: 112,
            lineHeight: 1,
            margin: "24px 0 28px",
            maxWidth: 900,
            letterSpacing: -2.5,
            transform: `translateY(${interpolate(entry, [0, 1], [42, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
            opacity: interpolate(entry, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {headline}
        </h1>

        <div style={{display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 44}}>
          {focusWords.slice(0, 6).map((word, i) => {
            const reveal = spring({
              frame: frame - (30 + i * 8),
              fps,
              config: {damping: 200},
            });

            return (
              <div
                key={word}
                style={{
                  border: `1px solid rgba(148, 163, 184, ${0.25 + i * 0.05})`,
                  borderRadius: 999,
                  padding: "15px 28px",
                  fontFamily: bodyFont,
                  color: "#E2E8F0",
                  fontWeight: 500,
                  fontSize: 33,
                  background: "rgba(15, 23, 42, 0.55)",
                  opacity: interpolate(reveal, [0, 1], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  transform: `translateY(${interpolate(reveal, [0, 1], [22, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}px)`,
                }}
              >
                {word}
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 22,
            marginBottom: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{display: "flex", gap: 18}}>
            <StatPill label="Current streak" value={`${streakCount} days`} delay={120} />
            <StatPill label="Ranked win rate" value={`${rateCount}%`} delay={128} />
          </div>

          <div
            style={{
              width: 268,
              height: 268,
              borderRadius: "50%",
              background: `linear-gradient(150deg, ${CARD} 0%, ${SURFACE} 100%)`,
              border: `2px solid ${FAINT}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 ${interpolate(progress, [0, 1], [0, 28], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}px rgba(52, 211, 153, 0.08)`,
              transform: `translateY(${Math.sin(frame / 16) * 10}px) rotate(${Math.sin(
                frame / 38,
              ) * 3}deg)`,
            }}
          >
            <Img
              src={staticFile("ink/base/droplet_01.svg")}
              style={{position: "absolute", width: 160, height: 160}}
            />
            <Img
              src={staticFile("ink/eyes/eyes_03.svg")}
              style={{position: "absolute", width: 104, height: 104}}
            />
            <Img
              src={staticFile("ink/accessories/crown_01.svg")}
              style={{position: "absolute", width: 148, height: 148, top: 26}}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            borderRadius: 999,
            border: `2px solid ${BLUE}`,
            background: "linear-gradient(90deg, rgba(59,130,246,0.24), rgba(52,211,153,0.22))",
            padding: "24px 36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: bodyFont,
            opacity: interpolate(frame, [210, 275], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [210, 275], [28, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          <div style={{color: "#F8FAFC", fontWeight: 700, fontSize: 42}}>{cta}</div>
          <div
            style={{
              color: MINT,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 2,
            }}
          >
            NEW QUIZ LIVE
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
