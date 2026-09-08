export type VillageBuildingId = 'home' | 'scriptorium' | 'mapmaker' | 'tea-room';

export interface VillageBuildingSpec {
  id: VillageBuildingId;
  name: string;
  entrance: { x: number; y: number };
  accent: number;
}

export const VILLAGE_BUILDINGS: VillageBuildingSpec[] = [
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
    name: "MARA'S HOUSE",
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
