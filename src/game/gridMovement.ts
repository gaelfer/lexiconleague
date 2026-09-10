import { MAP_TILE } from './pixelScale';
// One committed step is 16 native pixels, or 32 preserved map units.
export const GRID = MAP_TILE;
export interface GridPoint { x: number; y: number }
export const tileCenter = (value: number) => Math.round((value - GRID / 2) / GRID) * GRID + GRID / 2;

export function nextGridStep(from: GridPoint, dx: number, dy: number, clear: (a: GridPoint, b: GridPoint) => boolean): GridPoint | null {
  dx = Math.sign(dx); dy = Math.sign(dy);
  if (!dx && !dy) return null;
  const next = { x: from.x + dx * GRID, y: from.y + dy * GRID };
  if (dx && dy && (!clear(from, { x: next.x, y: from.y }) || !clear(from, { x: from.x, y: next.y }))) return null;
  return clear(from, next) ? next : null;
}

export function interpolateStep(from: GridPoint, to: GridPoint, elapsed: number, duration: number): GridPoint {
  const t = Math.min(1, Math.max(0, elapsed / duration));
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
