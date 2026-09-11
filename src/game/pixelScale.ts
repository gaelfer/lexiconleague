/** Native artwork pixels and legacy map units are intentionally separate.
 * Keeping map units stable preserves entrances, combat ranges and saved routes.
 * A map unit is half an art pixel: camera 0.5 × canvas 2 = 1 display unit.
 */
export const ART_TILE = 16;
export const DISPLAY_SCALE = 2;
export const MAP_UNITS_PER_PIXEL = 2;
export const MAP_TILE = ART_TILE * MAP_UNITS_PER_PIXEL;
export const WORLD_CAMERA_ZOOM = 1 / MAP_UNITS_PER_PIXEL;
export const sceneZoom = (_town: boolean) => WORLD_CAMERA_ZOOM * 1.5;
// Avatars use a 32x64 texture, but are authored in 2x2 clusters. This gives us
// enough source pixels for readable expressions while retaining a 16x32 look.
export const CHARACTER_FRAME = { width: 32, height: 64 } as const;
export const FACE_FRAME = CHARACTER_FRAME;
export const artToMap = (pixels: number) => pixels * MAP_UNITS_PER_PIXEL;
export const mapToArt = (units: number) => units / MAP_UNITS_PER_PIXEL;
