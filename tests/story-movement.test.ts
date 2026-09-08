import { describe, expect, it } from 'vitest';
import { resolveMovement, type Facing, type MovementInput } from '../src/game/movement';

const DIRECTIONS: Array<[Facing, MovementInput]> = [
  ['up', { up: true, down: false, left: false, right: false }],
  ['up-right', { up: true, down: false, left: false, right: true }],
  ['right', { up: false, down: false, left: false, right: true }],
  ['down-right', { up: false, down: true, left: false, right: true }],
  ['down', { up: false, down: true, left: false, right: false }],
  ['down-left', { up: false, down: true, left: true, right: false }],
  ['left', { up: false, down: false, left: true, right: false }],
  ['up-left', { up: true, down: false, left: true, right: false }],
];

describe('story movement', () => {
  it.each(DIRECTIONS)('resolves %s movement at a constant speed', (facing, input) => {
    const movement = resolveMovement(input);
    expect(movement.facing).toBe(facing);
    expect(Math.hypot(movement.x, movement.y)).toBeCloseTo(1, 8);
  });

  it('cancels opposing keys', () => {
    expect(resolveMovement({ up: true, down: true, left: true, right: true })).toEqual({
      x: 0,
      y: 0,
      facing: null,
    });
  });
});
