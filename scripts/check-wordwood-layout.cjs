const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const room=r=>page.waitForFunction(r=>window.__storyTest.state()[0].room===r,r,{timeout:15000});
 const outside=()=>page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene',null,{timeout:15000});
 const pos=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(550);};
 const shot=async(name)=>{await page.waitForTimeout(2600);await page.screenshot({path:`/tmp/wordwood-layout-${name}.png`});};
 const leave=async()=>{await pos(400,432);await page.keyboard.press('s');await outside();};
 const enter=async(r,x,y)=>{await pos(x,y);await page.keyboard.press('w');await room(r);};
 const close=async()=>{await page.waitForTimeout(350);await page.keyboard.press('e');await page.waitForTimeout(350);};
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({completedChapters:[1],wordwoodExpedition:{key:true,seal:true,gardenGateOpened:true,cleared:['maintenance','gallery','store','records','seal','vault']},chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],solved:true,echoOpen:true,found:[0]})}})));
  await page.goto('http://localhost:3000/story/2?storyTest');await outside();
  await enter('maintenance',432,272);await shot('workshop-flooded');
  await pos(336,336);await page.keyboard.press('e');await close();
  assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.gardenGateKey),false);
  await leave();await enter('gallery',1136,592);await shot('gallery');
  await pos(400,208);await page.keyboard.press('e');await close();
  await page.keyboard.press('w');await page.waitForTimeout(300);await page.keyboard.press('r');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.maintenance,null,{timeout:15000});await close();
  await leave();await enter('maintenance',432,272);await shot('workshop-drained');
  await pos(336,336);await page.keyboard.press('e');await close();
  assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.gardenGateKey),true);
  await leave();await enter('store',1008,912);await shot('store');
  for(const x of [336,368,400]){await pos(x,336);await page.keyboard.press('e');}
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.store,null,{timeout:15000});await close();await leave();
  await enter('hall',816,112);await shot('hall');
  await pos(240,368);await shot('pillar-behind');await pos(240,432);await shot('pillar-front');
  await pos(208,336);await page.keyboard.press('a');await room('drain');await shot('drain');
  await pos(592,336);await page.keyboard.press('d');await room('hall');
  await pos(592,336);await page.keyboard.press('d');await room('records');await shot('records');
  await pos(208,336);await page.keyboard.press('a');await room('hall');
  await pos(400,208);await page.keyboard.press('w');await room('seal');await shot('seal');
  await pos(400,208);await page.keyboard.press('w');await room('vault');await shot('vault');
  await pos(400,272);await page.keyboard.press('e');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.tablet,null,{timeout:15000});
  await page.waitForTimeout(2800);await close();
  await pos(400,432);await page.keyboard.press('s');await room('seal');
  await pos(400,432);await page.keyboard.press('s');await room('hall');await leave();
  assert.deepEqual(errors,[]);console.log('PASS: eight rooms, bidirectional connections, target drainage, chest lock/key, seed block, Tablet, depth views.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
