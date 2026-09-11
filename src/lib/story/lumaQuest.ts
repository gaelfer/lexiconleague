import {getStoryProgress,getStoryInventory,saveStoryInventory,saveStoryProgress} from './progress';
import {acceptSidequest,advanceSidequest} from './adventure';
export const LUMA_SKETCHBOOK={x:1904,y:400};
export function lumaConversation(){
 const state=getStoryProgress().quests?.['lumas-sketchbook'];
 if(!state)return {lines:['I had a little book with a green ribbon. I dropped it when we ran.','There’s a drawing of Mum in it. I got her smile right this time.','If you go past the orchard on the road, could you look? I’m staying here. I promised.'],done:()=>acceptSidequest('lumas-sketchbook')};
 if(state.status==='completed')return {lines:['I drew you on the last page. You’re holding the book very carefully.'],done:()=>true};
 if(state.steps.includes('found'))return {lines:['The ribbon! You found it!','Oh. The corner’s muddy. That’s all right. Mum still looks like Mum.','I’m going to show her. Will you tell her you found it? She’s outside.'],done:()=>advanceSidequest('lumas-sketchbook','returned')};
 return {lines:['It has a green ribbon. By the apple trees, I think. Everything happened so fast.'],done:()=>true};
}
export function recoverSketchbook(){return advanceSidequest('lumas-sketchbook','found');}
export function rewardLumaQuest(){
 const p=getStoryProgress(),quest=p.quests?.['lumas-sketchbook'];if(!quest?.steps.includes('returned'))return false;
 const bag=getStoryInventory();if(!saveStoryInventory({unlockedWeapons:[...new Set([...bag.unlockedWeapons,'bow'])]}))return false;
 return saveStoryProgress({quests:{...getStoryProgress().quests,'lumas-sketchbook':{steps:['found','returned','reward'],status:'completed'}}});
}
