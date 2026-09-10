/** Native artwork pixels and legacy map units are intentionally separate.
 * Keeping map units stable preserves entrances, combat ranges and saved routes.
 * A map unit is half an art pixel: camera 0.5 × canvas 2 = 1 display unit.
 */
export const ART_TILE = 16;
export const DISPLAY_SCALE = 2;
export const MAP_UNITS_PER_PIXEL = 2;
export const MAP_TILE = ART_TILE * MAP_UNITS_PER_PIXEL;
export const WORLD_CAMERA_ZOOM = 1 / MAP_UNITS_PER_PIXEL;
export const sceneZoom = (town: boolean) => WORLD_CAMERA_ZOOM * (town ? 1.25 : 1.5);
export const CHARACTER_FRAME = { width: 28, height: 56 } as const;
export const artToMap = (pixels: number) => pixels * MAP_UNITS_PER_PIXEL;
export const mapToArt = (units: number) => units / MAP_UNITS_PER_PIXEL;
