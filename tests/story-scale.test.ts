import { describe, expect, it, vi } from 'vitest';
import type * as Phaser from 'phaser';
import { INKLING_SCALE, TILE_SIZE, villagePaths } from '../src/game/world/pixelTerrain';
import { ART_TILE, DISPLAY_SCALE, CHARACTER_FRAME, WORLD_CAMERA_ZOOM, mapToArt, sceneZoom } from '../src/game/pixelScale';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT, AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT } from '../src/game/pixelAvatar';

describe('story world scale', () => {
  it('brings the town as close as adventure areas', () => {
    expect(sceneZoom(true)).toBe(WORLD_CAMERA_ZOOM*1.5);
    expect(sceneZoom(false)).toBe(WORLD_CAMERA_ZOOM*1.5);
  });
  it('uses 16px tiles and clustered 32×64 characters at unchanged display size', () => {
    expect(ART_TILE).toBe(16);
    expect(DISPLAY_SCALE).toBe(2);
    expect(mapToArt(TILE_SIZE)).toBe(16);
    expect(TILE_SIZE * WORLD_CAMERA_ZOOM * DISPLAY_SCALE).toBe(32);
    expect(CHARACTER_FRAME).toEqual({width:32,height:64});
    expect(TILE_SIZE).toBe(32);
    expect(AVATAR_LAYER_WIDTH * INKLING_SCALE).toBe(32);
    expect(AVATAR_LAYER_HEIGHT * INKLING_SCALE).toBe(64);
    expect(AVATAR_FACE_LAYER_WIDTH * INKLING_SCALE).toBe(32);
    expect(AVATAR_FACE_LAYER_HEIGHT * INKLING_SCALE).toBe(64);
  });

  it('fills adjacent 32px path tiles without a seam between their edges', () => {
    const g = { fillStyle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis() };
    villagePaths(g as unknown as Phaser.GameObjects.Graphics, [[0, 0, 64, 32]]);
    expect(g.fillRect).toHaveBeenCalledWith(0, 0, 32, 32);
    expect(g.fillRect).toHaveBeenCalledWith(32, 0, 32, 32);
    expect(g.fillRect).not.toHaveBeenCalledWith(30, 0, 2, 32);
  });
});
