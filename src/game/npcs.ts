export interface VillageNpcSpec {
  name: string;
  x: number;
  y: number;
  base: string;
  eyes: string;
  accessory: string;
  color: string;
  dialogue: string[];
  hubDialogue?: string[];
  hubOnly?: boolean;
  house?: string;
}

/** Mix-and-matched locker parts for the peaceful gathering before Wordwood. */
export const VILLAGE_NPCS: VillageNpcSpec[] = [
  {
    name: 'Mira',
    hubDialogue: ['Luma drew our house bigger than the Archive.', 'I asked why. “We live in it.” Hard to argue with that.'],
    x: 2635,
    y: 224,
    base: 'droplet_02',
    eyes: 'eyes_06',
    accessory: 'quill_01',
    color: '#f59e9e',
    dialogue: [
      'Everyone is safe. I counted twice. Three times for Luma.',
      'She saw the stranger near Wordwood. Please ask her about it—she is at home.',
      'And take the bridge as your landmark. The signs have not been themselves today.',
    ],
  },
  {
    name: 'Bramble',
    hubDialogue: ['Tansy talks to the seedlings. I said it was nonsense.', 'Mine have stopped growing. Hers have not.'],
    x: 2760,
    y: 390,
    base: 'droplet_04',
    eyes: 'eyes_03',
    accessory: 'scarf_01',
    color: '#65c58f',
    dialogue: [
      'I once spent an afternoon following a sign that said “bank.” Lovely river. Absolutely no money.',
      'Now I read the words around the tricky one before I choose a path. Wordwood enjoys a misunderstanding.',
    ],
  },
  {
    name: 'Sir Serif',
    hubDialogue: ['Nothing suspicious on patrol!', 'Except the bakery queue. Nobody moves that slowly unless they are hiding something.'],
    x: 2920,
    y: 216,
    base: 'droplet_03',
    eyes: 'eyes_05',
    accessory: 'helmet_01',
    color: '#73a8e8',
    dialogue: [
      'You held the road. Thank you. I mean it.',
      'I will guard the village while you are away.',
      'One tip: read a seal before hitting it. My sword still has the dent.',
    ],
  },
  {
    name: 'Pip',
    hubDialogue: ['I am teaching the fountain a spell.', 'So far it only knows “wet.”'],
    x: 3020,
    y: 408,
    base: 'droplet_05',
    eyes: 'eyes_08',
    accessory: 'wizard_01',
    color: '#c084fc',
    dialogue: [
      'I packed for an expedition. Three biscuits, a compass, and another biscuit in case the compass gets hungry.',
      'Mira says I am needed here. Apparently guarding the biscuits counts.',
      'When you get back, tell me one thing nobody has put in a book yet.',
    ],
  },
  { name: 'Nell', x: 2320, y: -430, base: 'droplet_01', eyes: 'eyes_06', accessory: 'scarf_01', color: '#c19772', hubOnly: true, house:'nell',
    dialogue: ['Fenn saves the crooked rolls for me. Same bread, cheaper price!', 'Please do not tell him I like them better.'] },
  { name: 'Rowan', x: 2480, y: -120, base: 'droplet_04', eyes: 'eyes_03', accessory: 'quill_01', color: '#83b5ab', hubOnly: true,
    dialogue: ['I take the long way home past the pond.', 'It only adds a minute. Best minute of my day.'] },
  { name: 'Fenn', x: 550, y: 350, base: 'droplet_03', eyes: 'eyes_06', accessory: 'scarf_01', color: '#d7aa78', hubOnly: true, house: 'baker',
    dialogue: ['Mind the flour! ...Too late. Welcome in.', 'The next batch is for everyone who helped on Archive Road. Yes, that includes you.'] },
  { name: 'Tansy', x: 550, y: 350, base: 'droplet_02', eyes: 'eyes_08', accessory: 'quill_01', color: '#96bd83', hubOnly: true, house: 'gardener',
    dialogue: ['This cutting came from Wordwood. It grows toward whoever is talking.', 'Bramble says plants cannot have favourites. Easy for him to say. He is not their favourite.'] },
  { name: 'Oren', x: 550, y: 350, base: 'droplet_05', eyes: 'eyes_04', accessory: 'scarf_01', color: '#b9a4cb', hubOnly: true, house: 'guest',
    dialogue: ['I painted the front door myself. There’s still a purple thumbprint on the other side.', 'I meant to unpack those boxes last week. They’re holding the shelves up rather nicely now.'] },
];
