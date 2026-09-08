import type { Facing } from './movement';

export interface Point {
  x: number;
  y: number;
}

const FACING_VECTORS: Record<Facing, Point> = {
  up: { x: 0, y: -1 },
  'up-right': { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
  right: { x: 1, y: 0 },
  'down-right': { x: Math.SQRT1_2, y: Math.SQRT1_2 },
  down: { x: 0, y: 1 },
  'down-left': { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
  left: { x: -1, y: 0 },
  'up-left': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
};

export function facingVector(facing: Facing): Point {
  return FACING_VECTORS[facing];
}

/** A sword swing hits only targets inside its forward-facing arc. */
export function isInSwordArc(
  origin: Point,
  target: Point,
  facing: Facing,
  range = 82,
): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return true;
  if (distance > range) return false;

  const direction = facingVector(facing);
  const forwardDot = (dx / distance) * direction.x + (dy / distance) * direction.y;
  return forwardDot >= 0.15;
}
