import type * as Phaser from 'phaser';

import { MAP_TILE } from '../pixelScale';
export const TILE_SIZE = MAP_TILE;
export const INKLING_SCALE = 0.78;

/** One native 16px tile occupies 32 map units. Variants survive reloads. */
export function grassTiles(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number) {
  g.fillStyle(0x284e40).fillRect(x, y, width, height);
  for (let py = y; py < y + height; py += TILE_SIZE) {
    for (let px = x; px < x + width; px += TILE_SIZE) {
      const n = Math.abs((px / TILE_SIZE * 73 + py / TILE_SIZE * 131) | 0);
      if (n % 7 > 2) continue;
      const dx = n % 9;
      g.fillStyle(n % 3 ? 0x345d48 : 0x224638).fillRect(px + dx, py + 10, 6, 2);
      g.fillStyle(0x53734f, 0.65).fillRect(px + dx + 1, py + 7, 1, 3);
      g.fillRect(px + dx + 4, py + 8, 1, 2);
    }
  }
}

/** Connected tile masks keep paving edges, texture and routes on the same grid. */
export function villagePaths(g: Phaser.GameObjects.Graphics, rectangles: number[][]) {
  const tiles = new Set<string>();
  for (const [x, y, w, h] of rectangles) {
    for (let ty = Math.floor(y / TILE_SIZE); ty < Math.ceil((y + h) / TILE_SIZE); ty++) {
      for (let tx = Math.floor(x / TILE_SIZE); tx < Math.ceil((x + w) / TILE_SIZE); tx++) tiles.add(`${tx},${ty}`);
    }
  }
  for (const key of tiles) {
    const [tx, ty] = key.split(',').map(Number);
    const x = tx * TILE_SIZE; const y = ty * TILE_SIZE;
    const n = Math.abs(tx * 73 + ty * 131);
    g.fillStyle([0xb49b70, 0xb89f75, 0xb7a079][n % 3]).fillRect(x, y, TILE_SIZE, TILE_SIZE);
    if (!tiles.has(`${tx},${ty - 1}`)) {
      g.fillStyle(0x728061).fillRect(x, y, TILE_SIZE, 3);
      g.fillStyle(0xd0b88b).fillRect(x + 2, y + 3, TILE_SIZE - 4, 1);
    }
    if (!tiles.has(`${tx},${ty + 1}`)) g.fillStyle(0x746f50).fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);
    if (!tiles.has(`${tx - 1},${ty}`)) g.fillStyle(0x7c805b).fillRect(x, y, 2, TILE_SIZE);
    if (!tiles.has(`${tx + 1},${ty}`)) g.fillStyle(0x7c805b).fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
    if (n % 4 === 0) {
      g.fillStyle(0x9d885f).fillRect(x + 4, y + 9, 4, 1);
      g.fillStyle(0xd2ba8c).fillRect(x + 10, y + 4, 2, 1);
    }
  }
}
