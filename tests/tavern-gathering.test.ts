import {it,expect} from 'vitest';
import {TAVERN_LINES} from '../src/game/story/tavernGathering';
import {VILLAGE_NPCS} from '../src/game/npcs';
it('gives every seated village guest distinct gathering-only dialogue',()=>{
 for(const name of ['Mira','Nell','Pip','Fenn','Tansy','Oren']){
  const resident=VILLAGE_NPCS.find(n=>n.name===name)!;
  expect(TAVERN_LINES[name]?.length).toBeGreaterThan(0);
  expect(TAVERN_LINES[name]).not.toEqual(resident.dialogue);
  expect(TAVERN_LINES[name]).not.toEqual(resident.hubDialogue);
 }
 expect(new Set(Object.values(TAVERN_LINES).map(lines=>lines[0])).size).toBe(6);
});
