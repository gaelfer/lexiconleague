import type * as Phaser from 'phaser';
import { box, PALETTE, rug } from './interiorKit';

export type FurnitureKind = 'bed' | 'table' | 'chest' | 'shelf' | 'plant' | 'map' | 'rug';
export interface FurnitureSpec {
  kind: FurnitureKind; x: number; y: number;
  wood?: number; fabric?: number; ceramic?: number;
  label: string; lines: string[];
}

/** Each item owns its graphics and material palette. No furniture is baked into
 * a floor image. Change a spec, or call recolor(), without editing the room. */
export function makeFurniture(scene: Phaser.Scene, spec: FurnitureSpec) {
  const g = scene.add.graphics().setPosition(spec.x, spec.y).setDepth(spec.kind === 'rug' ? -6 : 0);
  const size = spec.kind === 'bed' ? [112, 120] : spec.kind === 'shelf' ? [104, 104]
    : spec.kind === 'plant' ? [36, 48] : spec.kind === 'chest' ? [96, 64] : [144, 88];
  const [w, h] = size;
  const draw = () => {
    g.clear();
    const wood = spec.wood ?? PALETTE.timber;
    const fabric = spec.fabric ?? 0x527e70;
    const ceramic = spec.ceramic ?? 0xeee0bb;
    if (spec.kind === 'rug') { rug(g, 72, 44, 144, 88, fabric); return; }
    if (spec.kind === 'plant') {
      box(g, 5, 24, 28, 22, ceramic, { face: 5 });
      g.fillStyle(0x355d3e).fillEllipse(9, 19, 20, 12).fillEllipse(27, 13, 22, 13);
      g.fillStyle(0x739365).fillEllipse(17, 7, 13, 21); return;
    }
    box(g, 0, 0, w, h, wood, { face: 12 });
    if (spec.kind === 'bed') {
      g.fillStyle(ceramic).fillRoundedRect(7, 6, w - 14, h - 12, 5);
      g.fillStyle(0xf9eed3).fillRoundedRect(20, 12, w - 40, 24, 6);
      g.fillStyle(fabric).fillRect(7, 43, w - 14, h - 49);
      g.fillStyle(0xffffff, 0.15).fillRect(9, 44, w - 18, 4);
      box(g, 0, h - 8, w, 8, wood, { face: 8 });
    } else if (spec.kind === 'chest') {
      g.fillStyle(fabric).fillRect(5, 4, w - 10, h - 9);
      g.fillStyle(wood).fillRect(4, 40, w - 8, 4);
      g.fillStyle(0xbca571).fillRect(w / 2 - 5, 35, 10, 12);
    } else if (spec.kind === 'shelf') {
      for (let row = 0; row < 3; row++) {
        g.fillStyle(0x493c30).fillRect(7, 8 + row * 30, w - 14, 24);
        for (let i = 0; i < 5; i++) {
          g.fillStyle(i % 2 ? fabric : ceramic).fillRect(12 + i * 16, 13 + row * 30, 10, 18);
          g.fillStyle(0xddd2ad).fillRect(14 + i * 16, 16 + row * 30, 6, 2);
        }
        g.fillStyle(wood).fillRect(4, 30 + row * 30, w - 8, 4);
      }
    } else if (spec.kind === 'map') {
      g.fillStyle(ceramic).fillRect(10, 8, w - 20, h - 18);
      g.fillStyle(fabric).fillEllipse(45, 34, 44, 24).fillEllipse(104, 53, 35, 22);
      g.lineStyle(3, 0x628899).lineBetween(76, 16, 60, 64);
      g.lineStyle(2, 0x987052).lineBetween(23, 61, 118, 24);
    } else {
      g.fillStyle(fabric).fillRect(48, 3, 40, h - 6);
      for (const x of [27, 111]) {
        g.fillStyle(ceramic).fillEllipse(x, 35, 18, 15);
        g.fillStyle(0x72533c).fillEllipse(x, 33, 11, 8);
        g.lineStyle(2, ceramic).strokeCircle(x + 10, 35, 4);
      }
    }
  };
  draw();
  return { graphics: g, width: w, height: h,
    recolor(colors: Pick<FurnitureSpec, 'wood' | 'fabric' | 'ceramic'>) { Object.assign(spec, colors); draw(); },
  };
}
