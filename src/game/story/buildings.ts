export type VillageBuildingId = 'home' | 'scriptorium' | 'mapmaker' | 'tea-room' | 'baker' | 'gardener' | 'guard' | 'guest';

export interface VillageBuildingSpec {
  id: VillageBuildingId;
  name: string;
  entrance: { x: number; y: number };
  accent: number;
  hubOnly?: boolean;
}

export const VILLAGE_BUILDINGS: VillageBuildingSpec[] = [
  { id: 'baker', name: 'BAKER FENN’S HOME', entrance: { x: 1920, y: -554 }, accent: 0xc19772, hubOnly: true },
  { id: 'gardener', name: 'BRAMBLE’S COTTAGE', entrance: { x: 2830, y: -554 }, accent: 0x8fcfb7, hubOnly: true },
  { id: 'guard', name: 'SERIF’S QUARTERS', entrance: { x: 1920, y: -114 }, accent: 0x73a8e8, hubOnly: true },
  { id: 'guest', name: 'THE GUEST HOUSE', entrance: { x: 2920, y: -114 }, accent: 0xc19772, hubOnly: true },
  {
    id: 'home',
    name: 'YOUR HOME',
    entrance: { x: 1410, y: 196 },
    accent: 0x8fcfb7,
  },
  {
    id: 'scriptorium',
    name: 'THE SCRIPTORIUM',
    entrance: { x: 1960, y: 205 },
    accent: 0xc4b5fd,
  },
  {
    id: 'mapmaker',
    name: "MIRA'S HOUSE",
    entrance: { x: 2560, y: 202 },
    accent: 0xf0b77d,
  },
  {
    id: 'tea-room',
    name: 'MOSSBELL TEA ROOM',
    entrance: { x: 2830, y: 194 },
    accent: 0x8fcfb7,
  },
];
