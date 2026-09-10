import * as Phaser from 'phaser';

/** Same ink as the body, with a shaded lower rim and a small upper-left glint. */
export function createInkHand(scene: Phaser.Scene, x: number, y: number, color: number) {
  const rim = scene.add.circle(0, 0, 5.5, color).setStrokeStyle(1, 0x10263a, 0.65);
  const shade = scene.add.ellipse(0.6, 1.5, 9, 7, 0x071820, 0.28);
  const face = scene.add.ellipse(-0.5, -0.8, 9, 8, color);
  const glint = scene.add.ellipse(-1.8, -2.4, 3, 2, 0xffffff, 0.2);
  return scene.add.container(x, y, [rim, shade, face, glint]);
}
