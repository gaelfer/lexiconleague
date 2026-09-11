import type { InteriorPlan, RoomProp } from './interiorPlans';

export const INN_ROOM_COLUMNS=[1,5,9] as const;
export const INN_PEOPLE=[
  {id:'wren',name:'Wren',base:'droplet_03',eyes:'eyes_01',accessory:'glasses_01',color:0x111111,room:0,line:'Welcome to the Lantern Inn.'},
  {id:'hazel',name:'Hazel',base:'droplet_02',eyes:'eyes_06',accessory:'quill_01',color:0xc99b82,room:101,line:'I’m delivering letters tomorrow. Today I’m sorting them by how worried the envelopes look. This one has been folded six times.'},
  {id:'moss',name:'Moss',base:'droplet_04',eyes:'eyes_03',accessory:'scarf_01',color:0x86ac85,room:102,line:'I came for the market. Bought one plant. Now I need a second suitcase. It has been a very successful trip.'},
  {id:'rue',name:'Rue',base:'droplet_01',eyes:'eyes_04',accessory:'glasses_01',color:0x9aadd0,room:103,line:'The Archive opens early. I packed three books to read while waiting for the books. That sounded sensible at home.'},
  {id:'tobin',name:'Tobin',base:'droplet_05',eyes:'eyes_05',accessory:'scarf_01',color:0xcaa56e,room:201,line:'I repair clocks. Wren asked me to look at the one downstairs. It wasn’t broken. She just wanted breakfast to last longer.'},
  {id:'fern',name:'Fern',base:'droplet_02',eyes:'eyes_08',accessory:'scarf_01',color:0x89b3a0,room:202,line:'Fresh towels, fresh water, and absolutely no monsters under the bed. I checked. Twice. This room is all yours; I’m just finishing the linens.'},
  {id:'ada',name:'Ada',base:'droplet_03',eyes:'eyes_06',accessory:'quill_01',color:0xb799bd,room:203,line:'I’m sketching the village roofs. Every time I finish one, a bird lands on it. Apparently we’re collaborating.'},
] as const;
export const isPlayerInnRoom=(floor:number,room:number)=>floor===2&&room===2;
export const canEnterInnRoom=(floor:number,room:number,booked:boolean)=>
  (floor===1||floor===2)&&room>=1&&room<=3&&(!isPlayerInnRoom(floor,room)||booked);
const p=(asset:string,col:number,row:number,label:string,line:string):RoomProp=>({asset,col,row,label,line});
/** Each guest has two nearby work spots, connected by clear floor tiles. */
export function innRoutine(floor:number,room:number){
  const index=(floor-1)*3+room-1;
  const starts=[7,2,7,2,2,7];
  const activities=[['sorting letters','checking the addresses'],['tending seedlings','checking the window light'],['reading','looking for a reference'],['repairing a clock','sorting tiny tools'],['folding towels','checking the fresh linen'],['sketching rooftops','studying the view']];
  if(index===1)return [0,1].map(()=>({col:1,row:5,activity:'enjoying a quiet cup of tea',wait:Infinity}));
  return [starts[index],starts[index]+1].map((col,i)=>({col,row:1,activity:activities[index][i],wait:4800+i*1800}));
}
export function innPlan(floor:1|2,room?:number):InteriorPlan{
  if(room){
    const index=(floor-1)*3+room-1,leftBed=[true,false,true,false,false,true][index];
    const bed=leftBed?1:9,work=leftBed?7:2;
    const assets=['desk','seed-shelf','desk','table','washstand','map'];
    const labels=['LETTERS TO DELIVER','MARKET SEEDLINGS','READING NOTES','CLOCK REPAIRS','FRESH LINEN','ROOFTOP SKETCH'];
    const lines=['Six envelopes, sorted into tidy piles. One is addressed simply: Mum.','Little clay pots sit on a tray to catch the drips.','A bookmark says: You were supposed to be asleep three chapters ago.','Brass wheels arranged from smallest to smallest-but-slightly-bigger.','Clean towels folded into careful squares. The top one is still warm.','A bird has been added to the same roof four times.'];
    return {palette:(['rust','moss','plum','teal','teal','rust'] as const)[index],rug:[leftBed?1:7,2,3,3],props:[
      p('bed-head',bed,0,'BED','A deep quilt and a pillow that smells of lavender.'),
      p('bed-foot',bed,1,'BED','The quilt is tucked in at the corners.'),
      p('chest',leftBed?2:8,0,'TRAVELLER’S CHEST',isPlayerInnRoom(floor,room)?'Empty, and ready for your belongings.':'A luggage tag reads: Please do not feed the socks.'),
      p('cupboard',leftBed?0:10,0,'WARDROBE','Cedar shelves, a spare quilt, and two wooden coat pegs.'),
      p(assets[index],work,0,labels[index],lines[index]),
      p(index===1?'plant':index===4?'cupboard':'shelf',work+1,0,'PERSONAL THINGS',index===4?'Wren has labelled this shelf: Room 202. Fresh linen only.':'A few familiar things make a strange room feel like home.'),
      p('washstand',leftBed?10:0,0,'WASHSTAND','A pitcher, rosemary soap, and a neatly folded towel.'),
      p('tea-table',leftBed?8:2,5,'TEA TRAY','A little tray keeps the cups together. Someone saved you a biscuit.'),
      p('chair',leftBed?9:1,5,'CHAIR','An oak chair turned toward the tea tray.'),
      p('plant',leftBed?10:0,6,'WINDOW HERBS','Mint scents the quiet room.'),
    ]};
  }
  return {palette:floor===1?'rust':'moss',rug:floor===1?[4,2,3,4]:[1,2,3,4],props:floor===1?[
    p('counter-straight',0,4,'COUNTER','A polished oak counter, fitted snugly against the wall.'),
    p('counter-straight',1,4,'COUNTER','A smooth patch shows where generations of guests have leaned.'),
    p('counter-ledger',2,4,'RECEPTION','A brass bell and a guest book with well-thumbed pages.'),
    p('counter-corner',3,4,'COUNTER','The counter turns around Wren’s little reception nook.'),
    p('counter-side',3,3,'COUNTER','A raised oak lip keeps the room keys from sliding off.'),
    p('counter-end',3,2,'COUNTER','A neatly finished end, with a gap behind for the concierge.'),
    p('hearth',0,0,'HEARTH','The fire has been going since breakfast.'),
    p('cupboard',10,0,'LINEN CUPBOARD','Fresh towels, stacked with improbable precision.'),
    p('tea-table',0,5,'TEA','A pot of mossbell tea. Still warm.'),
    p('chair',0,6,'CHAIR','Sit long enough and someone will bring you a biscuit.'),
    p('plant',7,0,'POTTED FERN','The innkeeper turns it toward the window every morning.'),
  ]:[p('shelf',3,0,'TRAVELLERS’ LIBRARY','Take a book. Leave a book. Please leave the shelf.'),
    p('plant',7,0,'POTTED FERN','A small tag says: Upstairs fern. Do not swap.'),
    p('shelf',0,2,'BORROWED TALES','A traveller has left a book of sea stories. Every monster has been given a moustache.'),
    p('desk',2,3,'LETTER-WRITING TABLE','Paper, a trimmed quill, and a communal inkpot. A note says: Write home. They worry.'),
    p('chair',1,3,'READING CHAIR','The cushion dips in the middle. A very good chair for one more chapter.'),
    p('chair',3,3,'LETTER-WRITER’S CHAIR','Someone has carved a tiny heart under the armrest.'),
    p('candles',0,3,'READING LIGHT','A little brass tray catches the wax. Wren replaces the candle before it burns low.'),
    p('tea-table',2,5,'EVENING TEA','A covered pot of mint tea and two cups. Help yourself; leave the last biscuit for someone else.'),
    p('chair',1,5,'QUIET CORNER','From here, the downstairs chatter sounds pleasantly far away.'),
    p('chair',3,5,'QUIET CORNER','A wool cushion, patched with cloth from an old travelling cloak.'),
    p('chest',0,6,'SPARE QUILTS','Warm quilts for cold nights. Please return them without the crumbs.'),
    p('cupboard',10,0,'LINEN CUPBOARD','Every towel has a tiny lantern stitched into it.'),
    p('washstand',10,2,'SHARED WASHSTAND','A fresh pitcher, a basin, and soap scented with rosemary. No ink-stained towels downstairs, please.'),
    p('chest',10,3,'TRAVELLERS’ STORAGE','Spare slippers and folded cloaks. Muddy boots stay downstairs; Wren is very firm about this.') ]};
}
