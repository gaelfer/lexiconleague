import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoryProgress, saveStoryProgress, isChapterUnlocked, markChapterComplete } from '../src/lib/story/progress';
import {OPENING_STORY,RESCUED_CHATTER} from '../src/game/story/openingStory';

describe('solo opening progression',()=>{
  it('introduces Bellum without explaining the Blotlings before the camp',()=>{
    const dialogue=[...OPENING_STORY.rescue,...OPENING_STORY.scholar,...RESCUED_CHATTER['Sir Serif']].join(' ');
    expect(dialogue).toContain('Scholar Bellum');
    expect(dialogue).not.toContain('Vellum');
    expect(dialogue).not.toMatch(/corrupted Inklings|counter-ink|stole a leaf/i);
    expect(OPENING_STORY.scholar.join(' ')).toContain('mistake a theory for an answer');
  });
  beforeEach(()=>{
    const data=new Map<string,string>();
    vi.stubGlobal('localStorage',{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value)});
  });
  it('requires the scholar after rescuing the travellers',()=>{
    saveStoryProgress({opening:'chase'});
    expect(isChapterUnlocked(2)).toBe(false);
    saveStoryProgress({opening:'scholar'});markChapterComplete(1);
    expect(getStoryProgress().completedChapters).toContain(1);
    expect(isChapterUnlocked(2)).toBe(false);
    saveStoryProgress({opening:'wordwood'});
    expect(isChapterUnlocked(2)).toBe(true);
  });
  it('preserves old saves and already-completed Wordwood access',()=>{
    markChapterComplete(1);
    expect(isChapterUnlocked(2)).toBe(true);
    markChapterComplete(2);saveStoryProgress({opening:'scholar'});
    expect(isChapterUnlocked(2)).toBe(true);
  });
  it('keeps defeated enemies across checkpoint writes and reload reads',()=>{
    saveStoryProgress({opening:'chase',defeatedRoadEnemies:[0,1,2,4]});
    saveStoryProgress({chapterCheckpoints:{1:JSON.stringify({gates:[1],roadCleared:true})}});
    expect(getStoryProgress().defeatedRoadEnemies).toEqual([0,1,2,4]);
    expect(getStoryProgress().opening).toBe('chase');
  });
});
