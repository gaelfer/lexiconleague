const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pos=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(150);};
 const state=()=>page.evaluate(()=>window.__storyTest.state()[0]);
 const shot=async(name)=>{await page.waitForTimeout(450);await page.screenshot({path:`/tmp/wordwood-refresh-${name}.png`});};
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],solved:true,echoOpen:true})}})));
  await page.goto('http://localhost:3000/story/2?storyTest&arrival=gatehouse');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  await page.getByRole('status',{name:'Health: 3 of 3'}).waitFor();
  await shot('arrival');
  await page.evaluate(()=>window.__storyTest.takeTestHit(1));
  await page.getByRole('status',{name:'Health: 2 of 3'}).waitFor();
  await pos(752,112);await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].y===80);
  assert.equal((await state()).y,80,'Former spring footprint is walkable');
  await pos(816,112);await shot('repository-terrace');
  assert.equal(await page.evaluate(()=>window.__storyTest.combatState().enemies?.length??0),0,'No forest encounters');
  for(const [room,x,y] of [['maintenance',432,240],['gallery',1136,560],['store',1008,880]]){
   await pos(x,y+32);await shot(`${room}-exterior`);
   await page.keyboard.press('w');await page.waitForFunction(room=>window.__storyTest.state()[0].room===room,room);
   await shot(`${room}-interior`);
   assert.equal(await page.getByRole('status').count(),1);
   await pos(400,464);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
   await page.waitForTimeout(550);const before=await state();
   assert.equal(before.x,x);assert.equal(before.y,y+32);
   await page.keyboard.press('w');await page.waitForFunction(room=>window.__storyTest.state()[0].room===room,room);
   await page.waitForTimeout(550);await pos(400,464);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  }
  // A correct word arrangement is insufficient until every room is restored and cleared.
  for(const complete of [false,true]){
   await page.evaluate(complete=>{
    const key='lexiconleague:story:progress';const p=JSON.parse(localStorage.getItem(key));
    p.chapterCheckpoints[2]=JSON.stringify({words:['sturdy','hollow','winding'],found:[0],solved:false,echoOpen:false});
    p.wordwoodExpedition={maintenance:true,gallery:true,store:true,cleared:complete?['maintenance','gallery','store']:['maintenance','gallery']};
    localStorage.setItem(key,JSON.stringify(p));
   },complete);
   await page.goto('http://localhost:3000/story/2?storyTest');
   await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
   await pos(816,656);await page.keyboard.press('e');
   await page.waitForFunction(()=>!!window.__storyTest.puzzleState().panel);
   assert.equal(await page.evaluate(()=>window.__storyTest.puzzleState().solved),complete,'Room restoration gates the original word puzzle');
  }
  // Even a legacy solved-word save cannot advance the stones without all rooms.
  for(const complete of [false,true]){
   await page.evaluate(complete=>{
    const key='lexiconleague:story:progress',p=JSON.parse(localStorage.getItem(key));
    p.chapterCheckpoints[2]=JSON.stringify({words:['sturdy','hollow','winding'],found:[0],solved:true,echoOpen:false,echoStep:2});
    p.wordwoodExpedition={maintenance:true,gallery:true,store:true,cleared:complete?['maintenance','gallery','store']:['maintenance','gallery']};
    localStorage.setItem(key,JSON.stringify(p));
   },complete);
   await page.reload();await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
   for(const x of [688,944,816]){await pos(x,720);await page.waitForTimeout(350);}
   assert.equal(await page.evaluate(()=>window.__storyTest.puzzleState().open),complete,'Stones require all three rooms');
  }
  await pos(816,112);await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].room==='hall');
  await shot('hall');
  assert.deepEqual(errors,[]);
  console.log('PASS: health on arrival and damage; no spring collision or forest encounters; three exteriors/interiors; actual doorway entry and re-entry; Repository hall; no runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
