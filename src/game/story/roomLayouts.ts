import type { VillageBuildingId } from './buildings';
import type { FurnitureSpec, FurnitureKind } from '../world/furniture';

const item = (kind: FurnitureKind, x: number, y: number, label: string, line: string, fabric = 0x527e70): FurnitureSpec =>
  ({ kind, x, y, label, lines: [line], fabric });

export const ROOM_LAYOUTS: Record<VillageBuildingId, FurnitureSpec[]> = {
  nell:[item('bed',64,224,'NELL’S BED','A hand-sewn quilt in warm rust colours.'),item('table',304,272,'MENDING TABLE','Buttons, wool, and a scarf that belongs to Fenn.'),item('chest',624,400,'WOOL CHEST','A green ball of wool has escaped.')],
  home: [item('bed',64,224,'CHECK YOUR BED','One slipper. No sign of its partner. A mystery for a less urgent day.'),
    item('table',304,232,'CHECK BREAKFAST','Your toast has gone cold. Whoever cut it into triangles knew you well.'),
    item('chest',624,400,'OPEN THE CHEST','A letter from Vellum. The date is tomorrow. That cannot be right.'),
    item('rug',310,410,'', ''), item('plant',680,240,'CHECK THE PLANT','Still alive. You decide to count that as an achievement.')],
  baker: [item('bed',624,224,'CHECK THE QUILT','The quilt smells faintly of cinnamon.',0xb98761),
    item('table',112,248,'READ THE RECIPE','“One pinch.” Below it: “Fenn, YOUR pinch. Not Serif’s.”',0xb98761),
    item('shelf',304,224,'CHECK THE SHELVES','Flour, sugar, and a jar marked EMERGENCY BISCUITS.',0xb98761),
    item('chest',80,424,'CHECK THE TIN','Yesterday’s rolls. A note says: Free. Still good for dipping.',0xb98761)],
  gardener: [item('bed',64,240,'CHECK THE BED','There is a watering can beside the pillow.',0x819164),
    item('table',320,240,'READ THE LABELS','“Mint.” “Also mint.” “Stop planting mint.”',0x819164),
    item('plant',616,236,'CHECK THE CUTTING','It leans toward your voice.'), item('plant',688,260,'CHECK THE FERN','This one seems less interested.'),
    item('shelf',624,400,'CHECK THE SEEDS','Every envelope has a date and a tiny drawing.',0x819164)],
  guard: [item('bed',624,224,'CHECK THE BED','The corners are perfectly tucked. The pillow is upside down.',0x637f96),
    item('chest',80,240,'CHECK THE EQUIPMENT','Polished armour. Spare socks. More spare socks.',0x637f96),
    item('table',304,256,'READ THE ROSTER','Serif has given himself every night shift.',0x637f96),
    item('plant',96,432,'CHECK THE FERN','A helmet makes a surprisingly good flowerpot.')],
  guest: [item('bed',64,224,'OREN’S BED','The blanket matches the newly painted door.',0x967b8b),
    item('chest',624,224,'UNPACKED BOXES','Useful enough that Oren keeps delaying the unpacking.',0x967b8b),
    item('table',312,280,'HOUSEHOLD NOTES','Fix shelf. Buy onions. Stop using boxes to fix shelf.',0x967b8b),
    item('rug',312,420,'','',0x967b8b)],
  mapmaker: [item('map',296,240,'READ MIRA’S MAP','Bridges, paths, careful measurements. One corner says: Ask Luma about the silver sleeve.'),
    item('shelf',64,240,'CHECK THE MAP ROLLS','Every map is dated. Wordwood’s have the most corrections.'),
    item('table',624,408,'READ LUMA’S MAP','The bakery is enormous. Everything else fits around it.',0xad8590),
    item('rug',312,416,'','',0x647f8b)],
  scriptorium: [item('table',304,256,'CHECK THE WORKBENCH','A repaired sign: “Bridge.” Under it, in smaller letters: “Actually a bridge this time.”',0x7b7f9a),
    item('shelf',64,224,'CHECK THE INKS','Blue for rivers. Green for woods. Red for “please check this again.”',0x7b7f9a),
    item('shelf',624,224,'CHECK THE PAPERS','Blank sheets waiting for the next chapter.',0x7b7f9a),
    item('chest',624,432,'CHECK THE TOOLS','A quill, three rulers, and one ruler labelled DO NOT TRUST.',0x7b7f9a)],
  'tea-room': [item('table',80,272,'CHECK THE TABLE','Two cups. One has six sugars beside it.',0x8a936a),
    item('table',568,288,'READ THE MENU','Today: mossbell tea. Tomorrow: probably mossbell tea.',0x8a936a),
    item('shelf',320,224,'CHECK THE TEA TINS','The dented tin gets used most. It smells of apples.',0x8a936a),
    item('plant',688,440,'CHECK THE FLOWERS','Freshly cut. Someone takes care of this place.')],
};
