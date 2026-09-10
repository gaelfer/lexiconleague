import { describe, expect, it } from 'vitest';
import { checkWordwood, WORDS } from '../src/game/story/wordwoodPuzzle';

describe('Wordwood deduction', () => {
  it('has exactly one solution across all 27 possible arrangements', () => {
    const solutions = WORDS.flatMap((a) => WORDS.flatMap((b) => WORDS.map((c) => [a, b, c])))
      .filter((words) => checkWordwood(words) === null);
    expect(solutions).toEqual([['sturdy', 'hollow', 'winding']]);
  });
  it('explains reused words and the bridge meaning without penalizing attempts', () => {
    expect(checkWordwood(['hollow', 'hollow', 'winding'])).toContain('used a word twice');
    expect(checkWordwood(['hollow', 'sturdy', 'winding'])).toContain('strength');
  });
});
