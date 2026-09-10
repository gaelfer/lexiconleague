import * as Phaser from 'phaser';

export const VILLAGE_ROOM_WIDTH = 800;
export const VILLAGE_HEIGHT = 600;
export const VILLAGE_ROOM_COUNT = 4;

type AddObstacle = (x: number, y: number, width: number, height: number) => void;

const COLORS = {
  grass: 0x173f38,
  grassLight: 0x1c4a40,
  grassDark: 0x10352f,
  path: 0xc8aa72,
  pathLight: 0xddc38d,
  pathDark: 0x9b7a4d,
  ink: 0x10263a,
  mint: 0x58e0b0,
  gold: 0xf4c96b,
  stone: 0x64748b,
  stoneDark: 0x334155,
  wood: 0x7c4d32,
  roof: 0x31526b,
};

/** Build the Chapter 1 visual mockup and its static scenery collisions. */
export function buildInkwellVillage(scene: Phaser.Scene, addObstacle: AddObstacle) {
  drawTerrain(scene);
  drawPaths(scene);
  drawBoundary(scene);
  drawMossbellLane(scene, addObstacle);
  drawWordwellSquare(scene, addObstacle);
  drawEastScriptorium(scene, addObstacle);
  drawGatheringGlade(scene, addObstacle);
  addAmbientMotes(scene);
}

function drawTerrain(scene: Phaser.Scene) {
  const worldWidth = VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT;
  const terrain = scene.add.graphics().setDepth(-20);
  terrain.fillStyle(COLORS.grass);
  terrain.fillRect(0, 0, worldWidth, VILLAGE_HEIGHT);

  // Sparse clustered grass avoids a visible checkerboard beneath the scenery.
  for (let y = 0; y < VILLAGE_HEIGHT; y += 16) {
    for (let x = 0; x < worldWidth; x += 16) {
      const seed = ((x / 16) * 73 + (y / 16) * 131) % 37;
      if (seed < 5) {
        terrain.fillStyle(COLORS.grassDark, 0.25);
        terrain.fillEllipse(x + 6, y + 10, 18, 8);
        terrain.fillStyle(0x759c75, 0.28);
        terrain.fillRect(x + 4, y + 5, 2, 5);
        terrain.fillRect(x + 8, y + 3, 2, 7);
        terrain.fillRect(x + 12, y + 6, 2, 4);
      }
    }
  }
}

function drawPaths(scene: Phaser.Scene) {
  const g = scene.add.graphics().setDepth(-10);
  const worldWidth = VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT;

  // Main eastward road: the composition always leads toward the next Word Seal.
  g.fillStyle(0x0b2d28, 0.45);
  g.fillRoundedRect(0, 245, worldWidth, 126, 28);
  g.fillStyle(COLORS.pathDark);
  g.fillRoundedRect(0, 251, worldWidth, 112, 24);
  g.fillStyle(COLORS.path);
  g.fillRoundedRect(0, 257, worldWidth, 98, 20);

  // Irregular cobbles keep the road from looking like a UI rectangle.
  for (let x = 18; x < worldWidth; x += 38) {
    const rowOffset = (Math.floor(x / 38) % 3) * 9;
    g.fillStyle(x % 76 === 0 ? COLORS.pathLight : COLORS.pathDark, 0.55);
    g.fillRoundedRect(x, 276 + rowOffset, 22, 10, 3);
    g.fillRoundedRect(x + 12, 326 - rowOffset / 2, 18, 8, 3);
  }

  // Branches connect the road to each major landmark.
  drawPathBranch(g, 315, 116, 72, 172);
  drawPathBranch(g, 1195, 300, 150, 250);
  drawPathBranch(g, 1950, 112, 76, 176);
  drawPathBranch(g, 2780, 300, 280, 250);
}

function drawPathBranch(
  g: Phaser.GameObjects.Graphics,
  centerX: number,
  top: number,
  width: number,
  height: number,
) {
  g.fillStyle(COLORS.pathDark);
  g.fillRoundedRect(centerX - width / 2 - 4, top, width + 8, height, 18);
  g.fillStyle(COLORS.path);
  g.fillRoundedRect(centerX - width / 2, top, width, height, 16);
}

function drawBoundary(scene: Phaser.Scene) {
  for (let x = 28; x < VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT; x += 54) {
    addBush(scene, x, 22, 0.95 + (x % 3) * 0.04);
    addBush(scene, x + 16, VILLAGE_HEIGHT - 18, 1 + (x % 4) * 0.03);
  }
  for (let y = 70; y < VILLAGE_HEIGHT - 50; y += 58) {
    addBush(scene, 18, y, 1);
    addBush(scene, VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT - 18, y, 1);
  }
}

function drawMossbellLane(scene: Phaser.Scene, addObstacle: AddObstacle) {
  addCottage(scene, 315, 116, 190, 138, addObstacle, 0x31526b);
  addGarden(scene, 108, 92, 138, 102);
  addSign(scene, 575, 220, 'WORDWELL  →');
  addBench(scene, 530, 410);
  addLantern(scene, 635, 225);
  addLantern(scene, 635, 390);

  addTree(scene, 105, 454, 1.1, addObstacle);
  addTree(scene, 220, 470, 0.9, addObstacle);
  addTree(scene, 686, 112, 1.05, addObstacle);
  addFlowerPatch(scene, 370, 445, 0xf9a8d4);
  addFlowerPatch(scene, 445, 468, 0xfde68a);
  addAttackDamage(scene, 455, 198);
}

function drawWordwellSquare(scene: Phaser.Scene, addObstacle: AddObstacle) {
  const rx = VILLAGE_ROOM_WIDTH;
  addFountain(scene, rx + 400, 300, addObstacle);
  addMarketStall(scene, rx + 150, 102, 0xc2415b, addObstacle);
  addMarketStall(scene, rx + 630, 420, 0xd69e2e, addObstacle);
  addCottage(scene, rx + 610, 110, 174, 132, addObstacle, 0x694b7c);
  addBench(scene, rx + 245, 430);
  addLantern(scene, rx + 278, 205);
  addLantern(scene, rx + 520, 395);
  addTree(scene, rx + 90, 475, 1.02, addObstacle);
  addTree(scene, rx + 715, 90, 0.88, addObstacle);
  addFlowerPatch(scene, rx + 275, 104, 0x93c5fd);
  addFlowerPatch(scene, rx + 540, 474, 0xf9a8d4);
}

function drawEastScriptorium(scene: Phaser.Scene, addObstacle: AddObstacle) {
  const rx = VILLAGE_ROOM_WIDTH * 2;
  addCottage(scene, rx + 360, 112, 230, 150, addObstacle, 0x7c3f58);
  addPond(scene, rx + 560, 454, 260, 104, addObstacle);
  addSign(scene, rx + 145, 215, 'SCRIPTORIUM  →');
  addLantern(scene, rx + 160, 392);
  addLantern(scene, rx + 660, 218);
  addTree(scene, rx + 92, 100, 0.95, addObstacle);
  addTree(scene, rx + 720, 120, 1.08, addObstacle);
  addTree(scene, rx + 130, 478, 1.02, addObstacle);
  addFlowerPatch(scene, rx + 260, 460, 0xc4b5fd);
  addFlowerPatch(scene, rx + 695, 380, 0xfde68a);

}

function drawGatheringGlade(scene: Phaser.Scene, addObstacle: AddObstacle) {
  const rx = VILLAGE_ROOM_WIDTH * 3;

  // A warmer, safer palette gives the player a breath before entering Wordwood.
  const plaza = scene.add.graphics().setDepth(-5);
  plaza.fillStyle(0x224f42, 0.9);
  plaza.fillCircle(rx + 400, 305, 245);
  plaza.lineStyle(5, 0x79cba8, 0.25);
  plaza.strokeCircle(rx + 400, 305, 238);
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    plaza.fillStyle(i % 2 === 0 ? COLORS.pathLight : COLORS.pathDark, 0.42);
    plaza.fillRoundedRect(
      rx + 400 + Math.cos(angle) * 205 - 11,
      305 + Math.sin(angle) * 205 - 6,
      22,
      12,
      4,
    );
  }

  addCottage(scene, rx + 160, 115, 182, 136, addObstacle, 0x8b5e3c);
  addCottage(scene, rx + 430, 104, 194, 140, addObstacle, 0x3f6f65);
  addBench(scene, rx + 360, 438);
  addBench(scene, rx + 580, 165);
  addLantern(scene, rx + 230, 390);
  addLantern(scene, rx + 535, 408);
  addTree(scene, rx + 84, 470, 1.04, addObstacle);
  addTree(scene, rx + 670, 94, 0.96, addObstacle);
  addFlowerPatch(scene, rx + 160, 405, 0xfde68a);
  addFlowerPatch(scene, rx + 520, 485, 0xc4b5fd);

  // Wordwood arch: the only permanent destination lettering in the environment.
  const archX = rx + 746;
  const arch = scene.add.graphics().setDepth(5);
  arch.fillStyle(0x0b1d2d, 0.82);
  arch.fillRoundedRect(archX - 48, 218, 96, 176, 34);
  arch.fillStyle(0x173f38);
  arch.fillRoundedRect(archX - 31, 238, 62, 156, 28);
  arch.lineStyle(5, COLORS.gold, 0.78);
  arch.strokeRoundedRect(archX - 42, 224, 84, 170, 30);
  arch.fillStyle(0x31526b);
  arch.fillRoundedRect(archX - 62, 202, 124, 32, 8);
  scene.add.text(archX, 218, 'WORDWOOD', {
    fontFamily: 'Georgia, serif',
    fontSize: '11px',
    fontStyle: 'bold',
    color: '#f8e7b3',
    letterSpacing: 2,
  }).setOrigin(0.5).setDepth(6);
}

export function drawWordGate(scene: Phaser.Scene, x: number, y: number, gateNumber: number) {
  const g = scene.add.graphics().setDepth(3);
  const wallTop = 40;
  const wallBottom = VILLAGE_HEIGHT - 40;

  g.fillStyle(0x102f2d, 0.88);
  g.fillRect(x - 18, wallTop, 36, y - 98 - wallTop);
  g.fillRect(x - 18, y + 98, 36, wallBottom - (y + 98));

  for (let sy = wallTop + 12; sy < y - 104; sy += 32) addGateStone(g, x, sy);
  for (let sy = y + 110; sy < wallBottom; sy += 32) addGateStone(g, x, sy);

  // Pillars frame the interactive door and make its function readable at a glance.
  g.fillStyle(0x1e293b);
  g.fillRoundedRect(x - 42, y - 78, 20, 156, 6);
  g.fillRoundedRect(x + 22, y - 78, 20, 156, 6);
  g.fillStyle(COLORS.stone);
  g.fillRect(x - 46, y - 72, 28, 14);
  g.fillRect(x + 18, y - 72, 28, 14);
  g.fillStyle(COLORS.gold);
  g.fillRect(x - 46, y - 60, 28, 3);
  g.fillRect(x + 18, y - 60, 28, 3);

  scene.add
    .text(x, y - 105, `WORD SEAL ${gateNumber}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '10px',
      color: '#f8e7b3',
      backgroundColor: '#10263a',
      padding: { x: 9, y: 5 },
      letterSpacing: 1,
    })
    .setOrigin(0.5)
    .setDepth(7);
}

function addGateStone(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(COLORS.stoneDark);
  g.fillRoundedRect(x - 16, y, 32, 22, 5);
  g.lineStyle(1, COLORS.stone, 0.45);
  g.strokeRoundedRect(x - 16, y, 32, 22, 5);
}

function addCottage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  addObstacle: AddObstacle,
  roofColor: number,
) {
  const g = scene.add.graphics().setDepth(1);
  const left = x - width / 2;
  const top = y - height / 2;

  // Chunky storybook cottages use silhouette and material details instead of labels.
  g.fillStyle(0x071820, 0.42);
  g.fillRoundedRect(left + 10, top + 20, width, height - 4, 16);
  g.fillStyle(0xe8d8b0);
  g.fillRoundedRect(left, top + 44, width, height - 44, 12);
  g.fillStyle(0x6d715e, 0.28);
  g.fillRect(x + width * 0.25, top + 48, width * 0.25, height - 55);
  g.fillStyle(0x10263a, 0.25);
  g.fillRect(left + 3, top + 48, width - 6, 12);
  // Stone footing and a worn doorstep anchor the timber facade.
  g.fillStyle(0x58696a);
  g.fillRect(left, top + height - 7, width, 10);
  g.fillStyle(0x95a095);
  g.fillRect(x - 25, top + height, 50, 7);
  g.fillStyle(0x435756);
  g.fillRect(x - 25, top + height + 7, 50, 4);

  // Exposed dark timber makes the facade read as architecture at game scale.
  g.fillStyle(0x6b452f);
  g.fillRect(left + 10, top + 54, 7, height - 62);
  g.fillRect(left + width - 17, top + 54, 7, height - 62);
  g.fillRect(left + 12, top + 73, width - 24, 6);
  g.lineStyle(5, 0x8a5a38, 0.9);
  g.lineBetween(left + 17, top + 79, left + 54, top + height - 5);
  g.lineBetween(left + width - 17, top + 79, left + width - 54, top + height - 5);

  g.fillStyle(roofColor);
  g.fillPoints([
    new Phaser.Geom.Point(left - 14, top + 48),
    new Phaser.Geom.Point(left + 18, top + 8),
    new Phaser.Geom.Point(x, top - 18),
    new Phaser.Geom.Point(left + width - 18, top + 8),
    new Phaser.Geom.Point(left + width + 14, top + 48),
  ], true);
  // Shingle courses follow the widening roof plane, with shaded lower edges.
  for (let row = 0; row < 3; row++) {
    const inset = 26 - row * 12;
    const roofY = top + 12 + row * 12;
    g.lineStyle(2, 0x10263a, 0.4);
    g.lineBetween(left + inset, roofY + 10, left + width - inset, roofY + 10);
    for (let sx = left + inset + (row % 2) * 8; sx < left + width - inset; sx += 16) {
      g.lineBetween(sx, roofY + 2, sx, roofY + 10);
      g.fillStyle(0xd8e3ca, 0.12);
      g.fillRect(sx + 3, roofY + 2, 8, 2);
    }
  }
  g.lineStyle(6, 0x17283b, 0.82);
  g.lineBetween(left - 10, top + 47, x, top - 14);
  g.lineBetween(x, top - 14, left + width + 10, top + 47);
  g.lineStyle(3, 0xffffff, 0.09);
  g.lineBetween(left + 16, top + 28, x, top - 8);

  // Chimney and ivy keep the repeated cottage shape organic.
  g.fillStyle(0x584238);
  g.fillRoundedRect(left + width - 48, top - 4, 22, 43, 5);
  g.fillStyle(0x2f6e4f);
  g.fillCircle(left + 9, top + 71, 11);
  g.fillCircle(left + 16, top + 88, 9);

  g.fillStyle(COLORS.wood);
  g.fillRoundedRect(x - 18, top + height - 49, 36, 49, 13);
  g.fillStyle(0x3b2a22);
  g.fillRoundedRect(x - 12, top + height - 43, 24, 43, 10);
  g.fillStyle(COLORS.gold);
  g.fillCircle(x + 7, top + height - 22, 2.5);

  for (const wx of [left + 28, left + width - 52]) {
    g.fillStyle(0x1e3a5f);
    g.fillRoundedRect(wx, top + 88, 24, 25, 7);
    g.fillStyle(0xf1d8a0, 0.85);
    g.fillRoundedRect(wx + 4, top + 92, 16, 16, 4);
    g.lineStyle(2, 0xf8e7b3, 0.7);
    g.lineBetween(wx + 12, top + 92, wx + 12, top + 108);
    g.fillStyle(0x7c4d32);
    g.fillRect(wx - 3, top + 112, 30, 5);
    g.fillStyle(0xf9a8d4);
    g.fillCircle(wx + 5, top + 112, 3);
    g.fillCircle(wx + 18, top + 111, 3);
  }

  addObstacle(x, y + 10, width - 12, height - 16);
}

function addGarden(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
  const g = scene.add.graphics().setDepth(0);
  g.fillStyle(0x382e25);
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
  g.lineStyle(4, 0x8b6847, 1);
  g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
  for (let gy = y - 28; gy <= y + 28; gy += 28) {
    for (let gx = x - 44; gx <= x + 44; gx += 29) {
      g.fillStyle(0x4ade80, 0.9);
      g.fillCircle(gx, gy, 5);
      g.fillStyle((gx + gy) % 2 === 0 ? 0xf9a8d4 : 0xfde68a);
      g.fillCircle(gx, gy - 4, 3);
    }
  }
}

function addFountain(scene: Phaser.Scene, x: number, y: number, addObstacle: AddObstacle) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x071820, 0.35);
  g.fillEllipse(x + 5, y + 12, 150, 74);
  g.fillStyle(COLORS.stoneDark);
  g.fillEllipse(x, y + 5, 148, 78);
  g.fillStyle(COLORS.stone);
  g.fillEllipse(x, y, 140, 70);
  g.fillStyle(0x38bdf8, 0.75);
  g.fillEllipse(x, y - 1, 118, 50);
  g.fillStyle(0x7dd3fc, 0.34);
  g.fillEllipse(x - 14, y - 8, 58, 18);
  g.fillStyle(COLORS.stoneDark);
  g.fillRoundedRect(x - 12, y - 58, 24, 59, 8);
  g.fillStyle(COLORS.gold);
  g.fillCircle(x, y - 61, 12);
  g.fillStyle(COLORS.ink);
  g.fillCircle(x, y - 61, 6);
  addObstacle(x, y, 126, 62);
}

function addMarketStall(
  scene: Phaser.Scene,
  x: number,
  y: number,
  canopyColor: number,
  addObstacle: AddObstacle,
) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x071820, 0.35);
  g.fillRoundedRect(x - 66, y + 10, 140, 78, 9);
  g.fillStyle(COLORS.wood);
  g.fillRoundedRect(x - 64, y, 128, 78, 7);
  g.fillStyle(0xe9d8a6);
  g.fillRect(x - 56, y + 32, 112, 32);
  for (let i = 0; i < 4; i++) {
    g.fillStyle(i % 2 === 0 ? canopyColor : 0xf8e7b3);
    g.fillRect(x - 64 + i * 32, y - 5, 32, 28);
  }
  g.fillStyle(0x182431);
  g.fillRoundedRect(x - 58, y + 35, 116, 17, 5);
  for (let i = 0; i < 5; i++) {
    g.fillStyle(i % 2 === 0 ? 0x84cc8b : 0xf4c96b);
    g.fillCircle(x - 38 + i * 19, y + 43, 5);
  }
  addObstacle(x, y + 30, 128, 76);
}

function addAttackDamage(scene: Phaser.Scene, x: number, y: number) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x160c24, 0.72);
  g.fillEllipse(x, y + 18, 92, 34);
  g.fillCircle(x - 26, y + 3, 12);
  g.fillCircle(x + 18, y + 7, 16);
  g.lineStyle(5, 0x4c1d6f, 0.72);
  g.lineBetween(x - 11, y - 15, x + 7, y + 31);
  g.lineBetween(x + 20, y - 8, x - 4, y + 26);

  for (let i = 0; i < 3; i++) {
    const smoke = scene.add.circle(x - 18 + i * 17, y - 4, 9 + i * 2, 0x31243d, 0.3).setDepth(2);
    scene.tweens.add({
      targets: smoke,
      y: smoke.y - 24,
      alpha: 0.04,
      scale: 1.4,
      duration: 1300 + i * 240,
      yoyo: true,
      repeat: -1,
    });
  }
}

function addPond(scene: Phaser.Scene, x: number, y: number, width: number, height: number, addObstacle: AddObstacle) {
  const g = scene.add.graphics().setDepth(0);
  g.fillStyle(0x0a292d, 0.7);
  g.fillEllipse(x, y + 8, width + 18, height + 14);
  g.fillStyle(0x1c7790, 0.9);
  g.fillEllipse(x, y, width, height);
  g.lineStyle(5, 0x79cba8, 0.55);
  g.strokeEllipse(x, y, width, height);
  g.fillStyle(0x7dd3fc, 0.28);
  g.fillEllipse(x - 44, y - 17, 88, 20);
  for (const [lx, ly] of [[x + 58, y + 15], [x - 75, y + 8]]) {
    g.fillStyle(0x4d7c51);
    g.fillEllipse(lx, ly, 30, 15);
    g.fillStyle(0xf9a8d4);
    g.fillCircle(lx + 3, ly - 3, 4);
  }
  addObstacle(x, y, width - 20, height - 18);
}

function addTree(scene: Phaser.Scene, x: number, y: number, scale: number, addObstacle: AddObstacle) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x071820, 0.35);
  g.fillEllipse(x + 5, y + 28, 64 * scale, 24 * scale);
  g.fillStyle(0x6f4930);
  g.fillRoundedRect(x - 8 * scale, y - 5 * scale, 16 * scale, 40 * scale, 5);
  g.fillStyle(0x0d2f29);
  g.fillCircle(x - 15 * scale, y - 20 * scale, 25 * scale);
  g.fillCircle(x + 17 * scale, y - 22 * scale, 28 * scale);
  g.fillCircle(x, y - 40 * scale, 31 * scale);
  g.fillStyle(0x2f6e4f);
  g.fillCircle(x - 11 * scale, y - 31 * scale, 22 * scale);
  g.fillCircle(x + 13 * scale, y - 40 * scale, 20 * scale);
  g.fillStyle(0x77c878, 0.65);
  g.fillCircle(x - 15 * scale, y - 43 * scale, 8 * scale);
  g.fillCircle(x + 10 * scale, y - 54 * scale, 7 * scale);
  addObstacle(x, y + 16 * scale, 34 * scale, 26 * scale);
}

function addBush(scene: Phaser.Scene, x: number, y: number, scale: number) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x092c28);
  g.fillCircle(x - 12 * scale, y, 17 * scale);
  g.fillCircle(x + 12 * scale, y, 17 * scale);
  g.fillCircle(x, y - 9 * scale, 20 * scale);
  g.fillStyle(0x287052);
  g.fillCircle(x - 7 * scale, y - 6 * scale, 12 * scale);
  g.fillCircle(x + 9 * scale, y - 9 * scale, 10 * scale);
  g.fillStyle(0x86d98c, 0.55);
  g.fillCircle(x - 8 * scale, y - 13 * scale, 4 * scale);
}

function addLantern(scene: Phaser.Scene, x: number, y: number) {
  const glow = scene.add.circle(x, y - 34, 34, COLORS.gold, 0.08).setDepth(0);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.05, to: 0.13 },
    scale: { from: 0.9, to: 1.08 },
    duration: 1600,
    yoyo: true,
    repeat: -1,
  });
  const g = scene.add.graphics().setDepth(2);
  g.fillStyle(0x233344);
  g.fillRect(x - 3, y - 35, 6, 43);
  g.fillStyle(COLORS.gold);
  g.fillRoundedRect(x - 9, y - 48, 18, 22, 5);
  g.fillStyle(0xfff1ad, 0.85);
  g.fillRoundedRect(x - 5, y - 44, 10, 14, 3);
}

function addSign(scene: Phaser.Scene, x: number, y: number, label: string) {
  const g = scene.add.graphics().setDepth(2);
  g.fillStyle(0x5b3a29);
  g.fillRect(x - 3, y, 6, 36);
  g.fillStyle(0x9a6b3f);
  g.fillRoundedRect(x - 48, y - 18, 96, 30, 6);
  g.lineStyle(2, 0xd2a96d, 0.8);
  g.strokeRoundedRect(x - 48, y - 18, 96, 30, 6);
  scene.add
    .text(x, y - 3, label, { fontFamily: 'Arial, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#2b1b16' })
    .setOrigin(0.5)
    .setDepth(3);
}

function addBench(scene: Phaser.Scene, x: number, y: number) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x3b2a22);
  g.fillRect(x - 41, y + 9, 8, 18);
  g.fillRect(x + 33, y + 9, 8, 18);
  g.fillStyle(0x9a6b3f);
  g.fillRoundedRect(x - 48, y - 5, 96, 14, 5);
  g.fillRoundedRect(x - 45, y + 11, 90, 10, 4);
  g.lineStyle(2, 0xd2a96d, 0.45);
  g.lineBetween(x - 38, y, x + 38, y);
}

function addFlowerPatch(scene: Phaser.Scene, x: number, y: number, color: number) {
  const g = scene.add.graphics().setDepth(0);
  for (let i = 0; i < 7; i++) {
    const fx = x + ((i * 19) % 61) - 30;
    const fy = y + ((i * 13) % 35) - 17;
    g.fillStyle(0x4d9a65);
    g.fillRect(fx - 1, fy, 2, 9);
    g.fillStyle(color, 0.95);
    g.fillCircle(fx, fy, 4);
    g.fillStyle(0xfff1ad);
    g.fillCircle(fx, fy, 1.5);
  }
}

function addAmbientMotes(scene: Phaser.Scene) {
  const worldWidth = VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT;
  for (let i = 0; i < 22; i++) {
    const x = 70 + ((i * 173) % (worldWidth - 140));
    const y = 90 + ((i * 97) % 420);
    const mote = scene.add.circle(x, y, i % 3 === 0 ? 2 : 1.3, i % 2 === 0 ? COLORS.mint : COLORS.gold, 0.38).setDepth(4);
    scene.tweens.add({
      targets: mote,
      y: y - 12 - (i % 4) * 3,
      alpha: { from: 0.16, to: 0.62 },
      duration: 1500 + (i % 5) * 370,
      delay: (i % 6) * 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }
}
