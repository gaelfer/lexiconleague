import { describe, expect, it } from "vitest";
import {
  isHostTimedOut,
  nextPhaseAfterEndMatch,
  shouldAcceptEvent,
  sortStandings,
} from "../src/lib/classroom/reliability";

describe("classroom reliability helpers", () => {
  it("deduplicates event IDs deterministically", () => {
    const seen = new Set<string>();
    expect(shouldAcceptEvent(seen, "evt-1")).toBe(true);
    expect(shouldAcceptEvent(seen, "evt-1")).toBe(false);
    expect(shouldAcceptEvent(seen, "evt-2")).toBe(true);
  });

  it("detects host timeout correctly", () => {
    expect(isHostTimedOut(1000, 5000, 3000)).toBe(true);
    expect(isHostTimedOut(1000, 3999, 3000)).toBe(false);
  });

  it("sorts standings by score, then correct, then finish time", () => {
    const sorted = sortStandings([
      { id: "c", joinedAt: 3, scorePayload: null },
      { id: "a", joinedAt: 1, scorePayload: { score: 50, correct: 10, finishedAt: 9000 } },
      { id: "b", joinedAt: 2, scorePayload: { score: 50, correct: 10, finishedAt: 8000 } },
      { id: "d", joinedAt: 4, scorePayload: { score: 45, correct: 9, finishedAt: 7000 } },
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["b", "a", "d", "c"]);
  });

  it("maps end-match phase transitions", () => {
    expect(nextPhaseAfterEndMatch("hosting", true)).toBe("results");
    expect(nextPhaseAfterEndMatch("countdown", true)).toBe("lobby");
    expect(nextPhaseAfterEndMatch("entry", true)).toBe("entry");
    expect(nextPhaseAfterEndMatch("hosting", false)).toBe("hosting");
  });
});
