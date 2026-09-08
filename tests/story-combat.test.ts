import { describe, expect, it } from 'vitest';
import { facingVector, isInSwordArc } from '../src/game/combat';

describe('story combat', () => {
  it('maps all eight facings to unit vectors', () => {
    for (const facing of ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'] as const) {
      const vector = facingVector(facing);
      expect(Math.hypot(vector.x, vector.y)).toBeCloseTo(1, 8);
    }
  });

  it('hits a nearby target in front of the player', () => {
    expect(isInSwordArc({ x: 10, y: 10 }, { x: 60, y: 10 }, 'right')).toBe(true);
  });

  it('does not hit targets behind the player', () => {
    expect(isInSwordArc({ x: 10, y: 10 }, { x: -20, y: 10 }, 'right')).toBe(false);
  });

  it('does not hit targets beyond sword range', () => {
    expect(isInSwordArc({ x: 0, y: 0 }, { x: 90, y: 0 }, 'right')).toBe(false);
  });
});
