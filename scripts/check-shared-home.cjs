const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.STORY_TEST_URL||'http://localhost:3000';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pos=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(700);};
 const shot=name=>page.screenshot({path:`/tmp/shared-home-${name}.png`});
 try{
  await page.goto(`${base}/story`);
  for(const freed of [false,true]){
   await page.evaluate(freed=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({completedChapters:[1],wordwoodExpedition:{logGuardianFreed:freed,maintenance:true,cleared:['maintenance','store']},chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],solved:true,echoOpen:true,found:[0]})}})),freed);
   await page.goto(`${base}/story/2?storyTest`);await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
   await pos(592,272);await page.keyboard.press('d');await page.waitForTimeout(350);
   assert.equal(await page.evaluate(()=>window.__storyTest.state()[0].x),freed?624:592,'Bridge gap blocks movement only before rescue');
   await shot(freed?'bridge-fixed':'bridge-broken');
  }
  await page.evaluate(()=>window.__storyTest.reviewKeepers('cooking','home'));await page.waitForTimeout(600);
  await pos(432,272);await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].room==='maintenance');
  assert.deepEqual(await page.evaluate(()=>window.__storyTest.keeperState()),[{name:'keeper-bridgekeeper',activity:'sitting'},{name:'keeper-gardener',activity:'cooking'}]);
  await pos(528,368);await shot('kitchen-and-beds');
  await pos(560,240);await page.keyboard.press('e');await page.waitForTimeout(300);await shot('couple-dialogue');await page.keyboard.press('e');await page.waitForTimeout(300);
  await page.waitForFunction(()=>window.__storyTest.keeperPositions().some(k=>k.name==='keeper-gardener'&&k.activity==='walking'&&k.y>352&&k.y<416),null,{timeout:30000});
  assert.equal(await page.evaluate(()=>window.__storyTest.keeperPositions().find(k=>k.name==='keeper-gardener').x),560,'Walk through the clear aisle, not the candle table');
  await shot('gardener-clear-aisle');
  await page.waitForFunction(()=>window.__storyTest.keeperState().some(k=>k.name==='keeper-gardener'&&k.activity==='sitting'),null,{timeout:30000});
  await pos(560,432);await shot('gardener-sitting');
  await page.waitForFunction(()=>window.__storyTest.keeperState().some(k=>k.name==='keeper-gardener'&&k.activity==='cooking'),null,{timeout:30000});
  await shot('gardener-back-cooking');
  await pos(400,432);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  await pos(1008,912);await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].room==='store');
  assert.deepEqual(await page.evaluate(()=>window.__storyTest.keeperState()),[],'Gardener is not duplicated in her storehouse while cooking');
  await pos(528,368);await shot('storehouse-no-bed');
  assert.deepEqual(errors,[]);console.log('PASS broken/repaired bridge collision, shared home, cooking, no duplicate gardener, storehouse visit');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
