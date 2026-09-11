/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const position=(x,y)=>page.evaluate(({x,y})=>window.__storyTest.reviewPosition(x,y),{x,y});
 const state=()=>page.evaluate(()=>window.__storyTest.state()[0]);
 const step=async(key,x,y)=>{await page.keyboard.press(key);await page.waitForTimeout(350);const s=await state();assert.equal(s.x,x);assert.equal(s.y,y);};
 try{
  await page.goto('http://localhost:3001/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1,2],visitedInkwell:true,worldClock:{day:1,elapsed:660000},wordwoodExpedition:{tablet:true,logGuardianFreed:true}})));
  await page.goto('http://localhost:3001/story/1?storyTest&interiorReview=tea-room');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='VillageInteriorScene');await page.waitForTimeout(500);
  await page.screenshot({path:'/tmp/tea-tavern-entrance.png'});
  const residents=await page.evaluate(()=>window.__storyTest.residentState());assert.equal(residents.length,7);
  await position(400,432);await step('w',400,400);await step('w',400,368);await step('w',400,368);
  await position(368,432);await step('w',368,400);await step('w',368,368);await step('w',368,336);await step('w',368,304);await step('w',368,304);
  await position(304,272);await step('a',304,272);await step('d',336,272);await step('s',336,272);
  await position(400,400);await page.screenshot({path:'/tmp/tea-tavern-centre.png'});
  await position(400,432);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene!=='VillageInteriorScene');
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')));assert.ok(!progress.northernStory?.rumour);assert.deepEqual(errors,[]);
  console.log('PASS seven regulars, clear central/back-bar aisles, solid bar/seats, departure without tea does not trigger news, no browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
