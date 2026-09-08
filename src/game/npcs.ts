export interface VillageNpcSpec {
  name: string;
  x: number;
  y: number;
  base: string;
  eyes: string;
  accessory: string;
  color: string;
  dialogue: string[];
}

/** Mix-and-matched locker parts for the peaceful gathering before Wordwood. */
export const VILLAGE_NPCS: VillageNpcSpec[] = [
  {
    name: 'Mira',
    x: 2635,
    y: 224,
    base: 'droplet_02',
    eyes: 'eyes_06',
    accessory: 'quill_01',
    color: '#f59e9e',
    dialogue: [
      'You drove the Blotlings back! We heard every clash from here.',
      'Wordwood changes its paths. Read carefully when the trees test you.',
    ],
  },
  {
    name: 'Bramble',
    x: 2760,
    y: 390,
    base: 'droplet_04',
    eyes: 'eyes_03',
    accessory: 'scarf_01',
    color: '#65c58f',
    dialogue: [
      'A good reader looks for clues around an unfamiliar word.',
      'The sentence itself can be your map. That trick saved me in Wordwood.',
    ],
  },
  {
    name: 'Sir Serif',
    x: 2920,
    y: 216,
    base: 'droplet_03',
    eyes: 'eyes_05',
    accessory: 'helmet_01',
    color: '#73a8e8',
    dialogue: [
      'Your sword is quick, but answers break the seals.',
      'Beyond the arch, words and monsters work together. Be ready for both.',
    ],
  },
  {
    name: 'Pip',
    x: 3020,
    y: 408,
    base: 'droplet_05',
    eyes: 'eyes_08',
    accessory: 'wizard_01',
    color: '#c084fc',
    dialogue: [
      'Wordwood! Wordwood! I would go too, but my hat is scared.',
      'Come back and tell us what you find, okay?',
    ],
  },
];
