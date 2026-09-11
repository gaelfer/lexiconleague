/** Inkwell: user's reference layout, adapted with a dry southern promenade.
 * This is the model consumed by the renderer, doors and NPC placement. */
export const TOWN = {
  width: 1280, top: -128, height: 1408, spawn: { x: 640, y: 960 },
  gatehouse: { x:640, y:48, spawn:{x:656,y:80} },
  buildings: [
    { id: 'archive', x: 1040, y: 320, roof: 0x536576 },
    { id: 'inn', x: 832, y: 1200, roof: 0x647a75 },
    { id: 'nell', x: 256, y: 560, roof: 0x987151 },
    { id: 'baker', x: 192, y: 176, roof: 0x567e70 },
    { id: 'guard', x: 800, y: 816, roof: 0x526d83 },
    { id: 'mapmaker', x: 480, y: 560, roof: 0x9a7353 },
    { id: 'gardener', x: 800, y: 560, roof: 0x987151 },
    { id: 'tea-room', x: 768, y: 176, roof: 0x987151 },
    { id: 'guest', x: 1088, y: 816, roof: 0x826f76 },
    { id: 'scriptorium', x: 416, y: 176, roof: 0x626f87 },
  ],
  streets: [
    [608, 32, 64, 32],
    [608, 64, 64, 1248],
    [608, 1248, 416, 64],
    [128, 256, 736, 64],
    [224, 640, 992, 64],
    [1008, 384, 64, 320],
    [608, 896, 608, 64],
    [224, 1024, 992, 64],
    [320, 672, 64, 384],
  ],
  people: {
    Mira: [528, 696], Bramble: [864, 688], 'Sir Serif': [880, 912],
    Pip: [496, 416], Nell: [288, 320], Rowan: [448, 960],
  } as Record<string, number[]>,
};

export function townDoor(id: string) {
  const building = TOWN.buildings.find((entry) => entry.id === id);
  return building ? { x: building.x, y: building.y + 86 } : undefined;
}
