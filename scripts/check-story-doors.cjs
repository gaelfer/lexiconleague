const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>window.__storyTest.state()[0]);
 const move=async(axis,target)=>{
  for(let i=0;i<50;i++){
   const s=await state(),v=s[axis];if(Math.abs(v-target)<1)return;
   await page.keyboard.press(axis==='x'?(v<target?'d':'a'):(v<target?'s':'w'));
   await page.waitForFunction(({axis,next})=>Math.abs(window.__storyTest.state()[0][axis]-next)<1,{axis,next:v+Math.sign(target-v)*32},{timeout:5000});
  }throw Error('Unreachable '+axis+' '+target);
 };
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],visitedInkwell:true})));
  await page.goto('http://localhost:3000/story/village?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene');await page.waitForTimeout(500);
  await move('y',944);await move('x',848);await move('x',912);
  await page.screenshot({path:'/tmp/pass-below-serif.png'});
  await move('x',656);await move('y',720);await move('x',848);await move('x',912);
  await page.screenshot({path:'/tmp/pass-below-bramble.png'});
  await move('x',656);await move('y',1328);await move('x',848);
  await page.keyboard.press('e');await page.waitForTimeout(300);
  assert.equal((await state()).scene,'DungeonScene','E no longer enters doors');
  await page.keyboard.press('w');
  await page.waitForTimeout(40);
  assert.equal((await state()).scene,'DungeonScene','Approaching does not change rooms');
  assert.ok((await state()).y>1296,'Approaching must interpolate, not snap to the doorstep');
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.y===1296);
  assert.equal((await state()).x,848,'Door entry stays on the original grid column');
  await page.screenshot({path:'/tmp/inn-door-opening.png'});
  await page.waitForFunction(()=>{const s=window.__storyTest.state()[0];return s?.scene==='DungeonScene'&&s.y<1296&&s.y>1264;});
  await page.screenshot({path:'/tmp/inn-walk-through.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='InnScene');await page.waitForTimeout(500);
  await move('y',304);await page.keyboard.press('w');
  await page.waitForTimeout(180);await page.screenshot({path:'/tmp/bedroom-door-opening.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.room===2);await page.waitForTimeout(500);
  await page.keyboard.press('s');
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.room===undefined);await page.waitForTimeout(500);
  await move('y',432);await page.keyboard.press('s');
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='DungeonScene');
  await page.waitForTimeout(500);await move('x',656);await move('y',656);await move('x',272);
  await page.keyboard.press('w');
  await page.waitForTimeout(160);await page.screenshot({path:'/tmp/cottage-door-opening.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='VillageInteriorScene');await page.waitForTimeout(500);
  await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='DungeonScene');await page.waitForTimeout(500);
  await move('x',656);await move('y',432);await move('x',1040);await page.keyboard.press('w');
  await page.waitForTimeout(260);await page.screenshot({path:'/tmp/archive-door-opening.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='ArchiveScene');await page.waitForTimeout(500);
  await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='DungeonScene');
  await page.waitForTimeout(500);await move('x',656);await move('y',80);
  await page.keyboard.press('w');await page.waitForTimeout(180);await page.screenshot({path:'/tmp/wayfarer-door-opening.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='GatehouseScene');
  assert.deepEqual(errors,[]);console.log('PASS: centered entry, cottage/inn/bedroom/archive/Wayfarer doors, room exits and NPC clearance');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
