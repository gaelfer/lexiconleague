import * as Phaser from 'phaser';

/**
 * Shared drawing kit for village interiors.
 *
 * The target look is The Minish Cap's cosy 3/4 rooms: warm saturated plaster and
 * oak, chunky readable silhouettes, and cel shading rather than gradients. Three
 * rules keep every room consistent:
 *
 *  1. Light always falls from the upper left. Highlights sit on top/left faces,
 *     shading on bottom/right faces, and cast shadows fall down-right.
 *  2. Furniture is a box with a visible front face, so the room reads as a room
 *     with depth instead of a flat floor plan.
 *  3. Every object carries a dark outline of its own colour family, which is what
 *     makes GBA-era art read cleanly at small sizes.
 */

/** Depth bands so scenes layer consistently (the player occupies 8–14). */
export const DEPTH = {
  shell: -10,
  floorDecor: -6,
  shading: -5,
  furniture: 0,
  overhead: 20,
} as const;

export const ROOM = {
  width: 800,
  height: 600,
  /** Where the back wall stops and the floor begins. */
  floorTop: 192,
  wallTop: 20,
} as const;

export const PALETTE = {
  plaster: 0xe6c9a0,
  plasterAlt: 0xdcbc90,
  timber: 0x9a5f36,
  timberDark: 0x6b3d21,
  oak: 0xb8804a,
  oakAlt: 0xa77140,
  oakDark: 0x714825,
  cloth: 0xc2513a,
  linen: 0xf3e3c2,
  leaf: 0x5c8a4a,
  iron: 0x6c6a72,
  ink: 0x2f2438,
  flame: 0xffd487,
} as const;

// ── Colour helpers ───────────────────────────────────────────────────────────

function mix(color: number, target: number, t: number): number {
  const a = Phaser.Display.Color.IntegerToColor(color);
  const b = Phaser.Display.Color.IntegerToColor(target);
  return Phaser.Display.Color.GetColor(
    Math.round(a.red + (b.red - a.red) * t),
    Math.round(a.green + (b.green - a.green) * t),
    Math.round(a.blue + (b.blue - a.blue) * t),
  );
}

/** Warm highlight: pure white would wash the palette out, so tint toward cream. */
export const lighten = (color: number, t: number) => mix(color, 0xfff3d6, t);
/** Shadows keep a violet-brown bias so darks stay coloured, never muddy grey. */
export const darken = (color: number, t: number) => mix(color, 0x2a1a20, t);

// ── Primitives ───────────────────────────────────────────────────────────────

/** Soft contact shadow, always offset down-right from its object. */
export function castShadow(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  width: number,
  height: number,
  alpha = 0.3,
) {
  g.fillStyle(0x2a1a20, alpha * 0.5);
  g.fillEllipse(cx + 6, cy + 4, width + 12, height + 8);
  g.fillStyle(0x2a1a20, alpha);
  g.fillEllipse(cx + 4, cy + 2, width, height);
}

export interface BoxOptions {
  /** Height of the visible front face. 0 draws a flat, floor-level object. */
  face?: number;
  radius?: number;
  /** Draw the dark keyline. On by default — it is most of the style. */
  outline?: boolean;
  /** Draw the top-left highlight band. */
  highlight?: boolean;
  shadow?: boolean;
}

/**
 * The workhorse: a piece of furniture as a lit top surface plus a shaded front
 * face. `x, y` is the top-left of the top surface; `h` is the top surface depth.
 */
export function box(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  options: BoxOptions = {},
) {
  const face = options.face ?? 14;
  const radius = options.radius ?? 6;
  const outline = options.outline ?? true;
  const highlight = options.highlight ?? true;

  if (options.shadow ?? true) castShadow(g, x + w / 2, y + h + face - 2, w * 0.92, face * 0.7);

  // Front face first, so the top surface overlaps its upper edge cleanly.
  if (face > 0) {
    g.fillStyle(darken(color, 0.42));
    g.fillRoundedRect(x, y + h - radius, w, face + radius, radius);
    g.fillStyle(darken(color, 0.26));
    g.fillRect(x + 2, y + h, w - 4, Math.max(face * 0.42, 2));
  }

  g.fillStyle(color);
  g.fillRoundedRect(x, y, w, h, radius);

  if (highlight) {
    g.fillStyle(lighten(color, 0.42), 0.85);
    g.fillRoundedRect(x + 3, y + 3, w - 6, Math.max(h * 0.16, 3), radius * 0.5);
    // A slim left-edge catchlight sells the single light direction.
    g.fillStyle(lighten(color, 0.3), 0.5);
    g.fillRoundedRect(x + 3, y + 3, Math.max(w * 0.05, 3), h - 6, 2);
  }

  // Right side of the top surface falls away from the light.
  g.fillStyle(darken(color, 0.18), 0.55);
  g.fillRoundedRect(x + w - Math.max(w * 0.07, 4), y + 4, Math.max(w * 0.05, 3), h - 8, 2);

  if (outline) {
    g.lineStyle(2, darken(color, 0.66), 0.9);
    g.strokeRoundedRect(x, y, w, h + face, radius);
  }
}

/** A round-topped object (pots, stools, cushions, kettles). */
export function dome(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  color: number,
  shadow = true,
) {
  if (shadow) castShadow(g, cx, cy + radius * 0.8, radius * 1.8, radius * 0.7, 0.26);
  g.fillStyle(darken(color, 0.34));
  g.fillCircle(cx, cy + 2, radius);
  g.fillStyle(color);
  g.fillCircle(cx, cy, radius);
  g.fillStyle(lighten(color, 0.45), 0.8);
  g.fillCircle(cx - radius * 0.32, cy - radius * 0.34, radius * 0.3);
  g.lineStyle(2, darken(color, 0.62), 0.85);
  g.strokeCircle(cx, cy, radius);
}

// ── Room shell ───────────────────────────────────────────────────────────────

/** Warm oak plank floor with per-plank tone variation and shaded seams. */
export function plankFloor(g: Phaser.GameObjects.Graphics, accent: number) {
  const { floorTop, height, width } = ROOM;
  g.fillStyle(PALETTE.oak);
  g.fillRect(0, floorTop, width, height - floorTop);

  const plankHeight = 34;
  let row = 0;
  for (let y = floorTop; y < height; y += plankHeight) {
    // Alternating tones plus a slow third beat stops the floor looking striped.
    const tone = row % 2 === 0 ? PALETTE.oak : PALETTE.oakAlt;
    g.fillStyle(row % 3 === 0 ? lighten(tone, 0.08) : tone);
    g.fillRect(0, y, width, plankHeight);

    // Board seams: a dark line with a light lip beneath reads as a bevel.
    g.fillStyle(PALETTE.oakDark, 0.55);
    g.fillRect(0, y + plankHeight - 3, width, 3);
    g.fillStyle(lighten(PALETTE.oak, 0.22), 0.3);
    g.fillRect(0, y + plankHeight, width, 1);

    // Butt joints and grain flecks.
    for (let x = (row % 2 === 0 ? 120 : 300); x < width; x += 260) {
      g.fillStyle(PALETTE.oakDark, 0.45);
      g.fillRect(x, y + 2, 2, plankHeight - 5);
    }
    for (let x = 40 + (row * 53) % 90; x < width; x += 118) {
      g.fillStyle(PALETTE.oakDark, 0.14);
      g.fillRoundedRect(x, y + 11, 46, 3, 1);
    }
    row++;
  }

  // Faint accent wash ties the floor to the building's identity colour.
  g.fillStyle(accent, 0.05);
  g.fillRect(0, floorTop, width, height - floorTop);
}

/** Plaster back wall with a timber frame and a wainscot band. */
export function plasterWall(g: Phaser.GameObjects.Graphics, accent: number) {
  const { wallTop, floorTop, width } = ROOM;

  // Ceiling void above the wall keeps the room from touching the screen edge.
  g.fillStyle(darken(PALETTE.timberDark, 0.42));
  g.fillRect(0, 0, width, wallTop + 6);
  g.fillStyle(PALETTE.timberDark, 0.6);
  g.fillRect(0, wallTop, width, 6);

  g.fillStyle(PALETTE.plaster);
  g.fillRect(0, wallTop, width, floorTop - wallTop);

  // Plaster is patchy, not flat: broad soft blocks of a second tone.
  for (let x = 0; x < width; x += 96) {
    g.fillStyle(PALETTE.plasterAlt, (x / 96) % 2 === 0 ? 0.35 : 0.16);
    g.fillRect(x, wallTop, 96, floorTop - wallTop);
  }
  g.fillStyle(lighten(PALETTE.plaster, 0.4), 0.4);
  g.fillRect(0, wallTop, width, 16);

  // Exposed timber framing.
  g.fillStyle(PALETTE.timber);
  g.fillRect(0, wallTop, width, 12);
  for (const x of [88, 236, 400, 564, 712]) {
    g.fillStyle(PALETTE.timber);
    g.fillRect(x - 7, wallTop, 14, floorTop - wallTop - 14);
    g.fillStyle(lighten(PALETTE.timber, 0.32), 0.75);
    g.fillRect(x - 5, wallTop + 2, 4, floorTop - wallTop - 18);
    g.fillStyle(PALETTE.timberDark, 0.55);
    g.fillRect(x + 3, wallTop + 2, 4, floorTop - wallTop - 18);
  }

  // Wainscot / skirting where the wall meets the floor.
  g.fillStyle(PALETTE.timberDark);
  g.fillRect(0, floorTop - 22, width, 22);
  g.fillStyle(PALETTE.timber);
  g.fillRect(0, floorTop - 22, width, 6);
  g.fillStyle(accent, 0.3);
  g.fillRect(0, floorTop - 15, width, 3);
  g.fillStyle(lighten(PALETTE.timber, 0.35), 0.5);
  g.fillRect(0, floorTop - 22, width, 2);
}

/**
 * Ambient occlusion: stacked translucent bands that darken where the floor meets
 * the walls, plus corner vignettes. Cheap, and it is what stops the room from
 * looking like flat vector shapes.
 */
export function ambientShading(g: Phaser.GameObjects.Graphics) {
  const { floorTop, height, width } = ROOM;

  // Contact shade beneath the back wall, strongest right at the join.
  for (let i = 0; i < 14; i++) {
    g.fillStyle(0x2a1a20, 0.055 * (1 - i / 14));
    g.fillRect(0, floorTop + i * 3, width, 3);
  }
  // Side walls fall into shadow.
  for (let i = 0; i < 16; i++) {
    const alpha = 0.06 * (1 - i / 16);
    g.fillStyle(0x2a1a20, alpha);
    g.fillRect(i * 4, floorTop, 4, height - floorTop);
    g.fillRect(width - (i + 1) * 4, floorTop, 4, height - floorTop);
  }
  // Foreground darkens toward the camera, framing the play area.
  for (let i = 0; i < 12; i++) {
    g.fillStyle(0x2a1a20, 0.035 * (i / 12));
    g.fillRect(0, height - (i + 1) * 6, width, 6);
  }
}

// ── Light ────────────────────────────────────────────────────────────────────

const LIGHT_TEXTURE = 'interior-light-radial';

/**
 * A soft radial falloff baked once into a canvas texture. Stacked translucent
 * ellipses were the obvious approach and looked it — the steps between layers
 * read as hard rings. A real gradient is the only way to get a clean pool.
 */
function ensureLightTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(LIGHT_TEXTURE)) return;
  const size = 256;
  const canvas = scene.textures.createCanvas(LIGHT_TEXTURE, size, size);
  if (!canvas) return;
  const ctx = canvas.getContext();
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(0.75, 'rgba(255,255,255,0.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  // The game runs in pixelArt mode; the gradient needs smoothing or it bands.
  canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/**
 * Additive pool of light. Returned as an Image so callers can tween its alpha
 * for flicker; `intensity` is its resting alpha.
 */
export function lightPool(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  intensity = 0.16,
  depth: number = DEPTH.shading,
) {
  ensureLightTexture(scene);
  return scene.add
    .image(x, y, LIGHT_TEXTURE)
    .setDisplaySize(width, height)
    .setTint(color)
    .setAlpha(intensity)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);
}

/** A shaft of daylight from a wall window, landing as a parallelogram of floor. */
export function windowShaft(scene: Phaser.Scene, x: number, y: number, color = 0xfff0c0) {
  const g = scene.add.graphics().setDepth(DEPTH.shading);
  g.setBlendMode(Phaser.BlendModes.ADD);
  // Light from the upper left, so the beam lands down and to the right. Several
  // narrow slices with low alpha keep the beam's edges from reading as a decal.
  for (let i = 0; i < 5; i++) {
    const spread = 1 - i * 0.16;
    g.fillStyle(color, 0.022);
    g.fillPoints([
      new Phaser.Geom.Point(x - 34 * spread, y),
      new Phaser.Geom.Point(x + 34 * spread, y),
      new Phaser.Geom.Point(x + 96 + 40 * spread, ROOM.height - 30),
      new Phaser.Geom.Point(x + 96 - 40 * spread, ROOM.height - 30),
    ], true);
  }
  // Bright patch where the beam actually strikes the boards.
  lightPool(scene, x + 58, y + 130, 250, 190, color, 0.075);
  return g;
}

/**
 * Side walls. Without them the floor runs to the screen edge and the room reads
 * as a floor plan rather than an interior.
 */
export function sideWalls(g: Phaser.GameObjects.Graphics) {
  const { floorTop, height, width } = ROOM;
  const thickness = 30;
  for (const [x, lit] of [[0, true], [width - thickness, false]] as const) {
    g.fillStyle(lit ? PALETTE.plasterAlt : darken(PALETTE.plasterAlt, 0.22));
    g.fillRect(x, floorTop - 22, thickness, height - floorTop + 22);
    // Inner edge catches or loses the light depending on which wall it is.
    g.fillStyle(lit ? lighten(PALETTE.plaster, 0.3) : darken(PALETTE.plasterAlt, 0.4), 0.7);
    g.fillRect(lit ? x + thickness - 5 : x, floorTop - 22, 5, height - floorTop + 22);
    g.fillStyle(PALETTE.timberDark);
    g.fillRect(x, floorTop - 22, thickness, 10);
  }
}

/** Lantern that hangs above the player and pulses gently. */
export function hangingLamp(scene: Phaser.Scene, x: number, y: number) {
  const g = scene.add.graphics().setDepth(DEPTH.overhead);
  g.fillStyle(PALETTE.iron);
  g.fillRect(x - 2, 0, 4, y - 16);
  g.fillStyle(PALETTE.timberDark);
  g.fillRoundedRect(x - 20, y - 20, 40, 10, 4);
  g.fillStyle(darken(PALETTE.flame, 0.45));
  g.fillRoundedRect(x - 15, y - 12, 30, 28, 8);
  g.fillStyle(PALETTE.flame);
  g.fillRoundedRect(x - 11, y - 9, 22, 22, 6);
  g.fillStyle(lighten(PALETTE.flame, 0.6), 0.9);
  g.fillRoundedRect(x - 7, y - 6, 8, 12, 3);
  g.lineStyle(2, PALETTE.timberDark, 0.9);
  g.strokeRoundedRect(x - 15, y - 12, 30, 28, 8);

  const glow = lightPool(scene, x, y + 130, 460, 380, 0xffcf85, 0.2);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.15, to: 0.23 },
    duration: 2100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut',
  });
  return glow;
}

/** Wall window: frame, panes, sill, and the daylight it throws on the floor. */
export function wallWindow(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, x: number) {
  const y = 62;
  g.fillStyle(PALETTE.timberDark);
  g.fillRoundedRect(x - 42, y - 6, 84, 78, 8);
  g.fillStyle(0xbfe4ef);
  g.fillRoundedRect(x - 34, y, 68, 62, 5);
  // Sky gradient inside the pane, brightest at the top.
  g.fillStyle(0xe8f6f7, 0.75);
  g.fillRoundedRect(x - 34, y, 68, 26, 5);
  g.fillStyle(PALETTE.leaf, 0.4);
  g.fillCircle(x + 20, y + 56, 18);
  g.fillCircle(x - 18, y + 60, 14);
  g.fillStyle(PALETTE.timber);
  g.fillRect(x - 3, y, 6, 62);
  g.fillRect(x - 34, y + 28, 68, 6);
  g.fillStyle(PALETTE.timber);
  g.fillRoundedRect(x - 48, y + 70, 96, 10, 3);
  g.fillStyle(lighten(PALETTE.timber, 0.4), 0.7);
  g.fillRect(x - 46, y + 70, 92, 2);
  g.lineStyle(2, PALETTE.timberDark, 0.85);
  g.strokeRoundedRect(x - 42, y - 6, 84, 78, 8);
  windowShaft(scene, x, y + 74);
}

// ── Dressing ─────────────────────────────────────────────────────────────────

/** Woven rug with a border and fringe. Sits flat, so no front face. */
export function rug(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  color: number,
) {
  g.fillStyle(0x2a1a20, 0.18);
  g.fillEllipse(cx + 4, cy + 4, w, h);
  g.fillStyle(darken(color, 0.3));
  g.fillEllipse(cx, cy, w, h);
  g.fillStyle(color);
  g.fillEllipse(cx, cy, w - 14, h - 12);
  g.fillStyle(lighten(color, 0.35), 0.65);
  g.fillEllipse(cx, cy, w - 44, h - 38);
  g.fillStyle(darken(color, 0.25), 0.7);
  g.fillEllipse(cx, cy, w - 74, h - 62);
  // Fringe.
  g.fillStyle(darken(color, 0.4), 0.8);
  for (let i = -w / 2 + 12; i < w / 2 - 8; i += 14) {
    g.fillRect(cx + i, cy - h / 2 - 3, 3, 6);
    g.fillRect(cx + i, cy + h / 2 - 3, 3, 6);
  }
}

/** Tall storage unit against the back wall: carcass, shelves, and contents. */
export function shelfUnit(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  shelves: number,
  fill: (shelfIndex: number, shelfY: number) => void,
) {
  castShadow(g, x + w / 2, y + h, w * 0.9, 16, 0.32);
  g.fillStyle(darken(PALETTE.timber, 0.5));
  g.fillRoundedRect(x, y, w, h, 6);
  g.fillStyle(PALETTE.timber);
  g.fillRoundedRect(x + 5, y + 5, w - 10, h - 10, 4);
  g.fillStyle(darken(PALETTE.timber, 0.55));
  g.fillRect(x + 9, y + 9, w - 18, h - 18);

  const gap = (h - 18) / shelves;
  for (let i = 0; i < shelves; i++) {
    const shelfY = y + 9 + gap * (i + 1);
    fill(i, shelfY - 4);
    g.fillStyle(PALETTE.timber);
    g.fillRect(x + 7, shelfY - 4, w - 14, 5);
    g.fillStyle(lighten(PALETTE.timber, 0.4), 0.7);
    g.fillRect(x + 7, shelfY - 4, w - 14, 2);
  }
  g.lineStyle(2, darken(PALETTE.timber, 0.7), 0.9);
  g.strokeRoundedRect(x, y, w, h, 6);
}

/** Framed picture or hanging on the back wall. */
export function wallHanging(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  y: number,
  w: number,
  h: number,
  color: number,
  paint: (innerX: number, innerY: number, innerW: number, innerH: number) => void,
) {
  const x = cx - w / 2;
  g.fillStyle(0x2a1a20, 0.22);
  g.fillRoundedRect(x + 4, y + 5, w, h, 4);
  g.fillStyle(darken(PALETTE.timber, 0.3));
  g.fillRoundedRect(x, y, w, h, 4);
  g.fillStyle(PALETTE.timber);
  g.fillRoundedRect(x + 3, y + 3, w - 6, h - 6, 3);
  g.fillStyle(color);
  g.fillRect(x + 9, y + 9, w - 18, h - 18);
  paint(x + 9, y + 9, w - 18, h - 18);
  g.lineStyle(2, darken(PALETTE.timber, 0.65), 0.9);
  g.strokeRoundedRect(x, y, w, h, 4);
}

/** Floating dust caught in the light — the last touch that makes a room breathe. */
export function dustMotes(scene: Phaser.Scene, count = 14) {
  for (let i = 0; i < count; i++) {
    const x = 60 + (i * 151) % (ROOM.width - 120);
    const y = 200 + (i * 97) % 340;
    const mote = scene.add
      .circle(x, y, i % 3 === 0 ? 2 : 1.4, 0xfff0c0, 0.4)
      .setDepth(DEPTH.overhead - 1);
    scene.tweens.add({
      targets: mote,
      y: y - 16 - (i % 4) * 4,
      x: x + 8,
      alpha: { from: 0.1, to: 0.5 },
      duration: 2400 + (i % 5) * 420,
      delay: (i % 6) * 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }
}

/** The doormat and threshold the player walks onto to leave. */
export function exitThreshold(g: Phaser.GameObjects.Graphics, accent: number) {
  const cx = 400;
  const y = 556;
  g.fillStyle(PALETTE.timberDark);
  g.fillRoundedRect(cx - 62, y - 6, 124, 50, 10);
  g.fillStyle(darken(PALETTE.timber, 0.15));
  g.fillRoundedRect(cx - 56, y, 112, 44, 8);
  g.fillStyle(PALETTE.linen, 0.5);
  g.fillRoundedRect(cx - 46, y + 6, 92, 26, 6);
  for (let x = cx - 40; x < cx + 40; x += 12) {
    g.fillStyle(accent, 0.4);
    g.fillRect(x, y + 10, 6, 18);
  }
  g.lineStyle(2, darken(PALETTE.timber, 0.6), 0.8);
  g.strokeRoundedRect(cx - 56, y, 112, 44, 8);
}
