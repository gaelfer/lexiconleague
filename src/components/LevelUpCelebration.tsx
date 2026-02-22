"use client";

import { Player } from "@remotion/player";
import { LevelUpBurst } from "./remotion/LevelUpBurst";

interface LevelUpCelebrationProps {
  level: number;
  playNonce: number;
}

export default function LevelUpCelebration({ level, playNonce }: LevelUpCelebrationProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      <Player
        key={playNonce}
        component={LevelUpBurst}
        inputProps={{ level }}
        durationInFrames={70}
        compositionWidth={1000}
        compositionHeight={1000}
        fps={30}
        controls={false}
        loop={false}
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}
