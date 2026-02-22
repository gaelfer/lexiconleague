import {Composition, Folder} from "remotion";
import {
  LexiconLeagueHype,
  type LexiconLeagueHypeProps,
} from "./LexiconLeagueHype";

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="LexiconLeague">
      <Composition
        id="LexiconLeagueHype"
        component={LexiconLeagueHype}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            headline: "Turn Words Into Win Streaks",
            cta: "Play Lexicon League",
            streakDays: 17,
            winRate: 82,
            focusWords: [
              "Magnanimous",
              "Ephemeral",
              "Perspicacious",
              "Ubiquitous",
              "Intransigent",
              "Sycophant",
            ],
          } satisfies LexiconLeagueHypeProps
        }
      />
    </Folder>
  );
};
