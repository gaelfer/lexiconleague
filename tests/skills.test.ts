import {describe,it,expect} from 'vitest';
import {canLearnSkill,spinProfile,skillPoints} from '../src/lib/story/skills';
import type {StoryProgress} from '../src/lib/story/progress';
describe('story skills',()=>{
 const fresh={completedChapters:[],learnedSkills:[]} as unknown as StoryProgress;
 it('starts with one point and an unlearned spin',()=>{expect(skillPoints(fresh)).toBe(1);expect(canLearnSkill(fresh,'spin')).toBe(true);expect(spinProfile(fresh).learned).toBe(false);expect(canLearnSkill(fresh,'wide-spin')).toBe(false);});
 it('preserves legacy spin',()=>expect(spinProfile({...fresh,learnedSkills:undefined}).learned).toBe(true));
 it('applies earned upgrades',()=>{const p={...fresh,completedChapters:[1],learnedSkills:['spin','focused-spin','wide-spin'],wordwoodExpedition:{logGuardianFreed:true}} as StoryProgress;expect(spinProfile(p)).toMatchObject({chargeMs:500,radius:96,damage:3});expect(skillPoints(p)).toBe(0);});
});
