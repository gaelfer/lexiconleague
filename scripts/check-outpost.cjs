/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
const pos=(x,y)=>page.evaluate(({x,y})=>window.__storyTest.reviewPosition(x,y),{x,y}),state=()=>page.evaluate(()=>window.__storyTest.state()[0]),progress=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')));
const step=async k=>{await page.keyboard.press(k);await page.waitForTimeout(350);},close=async()=>{for(let i=0;i<15&&(await state()).dialogue;i++)await step('e');};
const floor=async n=>{await page.waitForFunction(n=>window.__storyTest?.state()[0]?.scene==='NorthernTrailScene'&&window.__storyTest.state()[0].floor===n,n);await page.waitForTimeout(600);};
try{
await page.goto('http://localhost:3001/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1,2],visitedInkwell:true,worldClock:{day:2,elapsed:120000},northernStory:{tea:true,rumour:true,escort:true,escortDay:2},wordwoodExpedition:{tablet:true,logGuardianFreed:true}})));
await page.goto('http://localhost:3001/story/1?storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene');await pos(1168,48);await step('w');await floor(0);
await pos(368,816);await step('d');assert.equal((await state()).x,400);await step('w');assert.equal((await state()).y,784);await page.screenshot({path:'/tmp/northmeadow-day.png'});
await pos(464,368);await page.screenshot({path:'/tmp/outpost-exterior.png'});await step('w');await floor(1);
await pos(528,416);await step('e');assert.equal((await state()).floor,1);await close();
for(let f=1;f<=4;f++){
 for(let i=0;i<65;i++){await close();const enemies=await page.evaluate(()=>window.__storyTest.northernState().enemies);if(!enemies.length)break;const e=enemies[0];await pos(Math.round((e.x-16)/32)*32+16,Math.round((e.y-16)/32)*32+48);await page.evaluate(()=>{window.__storyTest.reviewFacing('up');window.__storyTest.reviewHeal();});await step('q');}
 await close();assert.ok((await progress()).northernStory.outpostFloors.includes(f));await pos(400,400);await page.screenshot({path:`/tmp/outpost-floor-${f}.png`});console.log('PASS floor',f,'surrender and saved clear');
 if(f<4){await pos(528,416);await step('e');await floor(f+1);}
}
await pos(464,256);await step('e');await close();assert.ok((await progress()).northernStory.dictionary);await pos(400,256);await step('e');await close();assert.ok((await progress()).northernStory.cured);console.log('PASS top-floor dictionary and cure');
for(let f=4;f>0;f--){await pos(240,416);await step('e');await floor(f-1);}
await page.evaluate(()=>{const key='lexiconleague:story:progress',p=JSON.parse(localStorage.getItem(key));p.worldClock.elapsed=960000;localStorage.setItem(key,JSON.stringify(p));window.dispatchEvent(new CustomEvent('story-save',{detail:{ok:true}}));});await page.waitForTimeout(500);assert.equal((await page.evaluate(()=>window.__storyTest.northernState())).enemies.length,6);await pos(464,816);await page.screenshot({path:'/tmp/northmeadow-night.png'});
await page.evaluate(()=>{const key='lexiconleague:story:progress',p=JSON.parse(localStorage.getItem(key));p.worldClock={day:3,elapsed:120000};localStorage.setItem(key,JSON.stringify(p));window.dispatchEvent(new CustomEvent('story-save',{detail:{ok:true}}));});await page.waitForTimeout(500);assert.equal((await page.evaluate(()=>window.__storyTest.northernState())).enemies.length,0);console.log('PASS night enemies spawn and dawn clears them');
await pos(464,1456);await step('s');await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='DungeonScene');assert.deepEqual(errors,[]);console.log('PASS four-floor return to road, no browser errors');
}catch(e){console.log(await state());await page.screenshot({path:'/tmp/outpost-failure.png'});throw e;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
