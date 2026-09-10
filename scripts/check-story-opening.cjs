// Run with NODE_PATH pointing to a Playwright installation. Uses an isolated browser save.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const state=()=>page.evaluate(()=>window.__storyTest?.state()[0]);
 const ready=scene=>page.waitForFunction(scene=>window.__storyTest?.state()[0]?.scene===scene,scene);
 const tap=async key=>{await page.keyboard.press(key);await page.waitForTimeout(300);};
 const move=async(key,axis,target)=>{
   await page.keyboard.down(key);
   try{await page.waitForFunction(({axis,target})=>Math.abs(window.__storyTest.state()[0][axis]-target)<2,{axis,target},{timeout:8000});}
   finally{await page.keyboard.up(key);}
   await page.waitForTimeout(250);
 };
 try{
  await page.goto('http://localhost:3000/story/1?storyTest');await ready('WakeScene');
  await page.waitForTimeout(1900);await page.screenshot({path:'/tmp/story-wake.png'});
  await tap('e');await move('s','y',432);await move('d','x',400);await move('s','y',464);
  await ready('DungeonScene');await page.waitForFunction(()=>!!window.__storyTest.state()[0].dialogue);
  await page.screenshot({path:'/tmp/story-luma.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0].speech.nod!==0);
  assert.equal((await state()).speech.speaker,'luma');
  for(let i=0;i<3;i++)await tap('e');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).opening),'chase');
  const start=(await state()).x;await tap('d');assert((await state()).x>start);
  assert((await state()).luma,'Luma should accompany the player');
  assert.deepEqual((await state()).luma,{x:start,y:(await state()).y},'Luma should reach the previous tile');
  assert.equal((await state()).speech.speaker,undefined);
  await page.evaluate(()=>window.__storyTest.takeTestHit());assert.equal((await state()).hearts,2);
  await tap('a');await tap('e');await ready('WakeScene');
  assert.equal((await state()).hearts,2,'Entering home alone must not heal');
  await move('a','x',272);await move('w','y',272);await tap('e');
  await page.waitForTimeout(2200);await page.screenshot({path:'/tmp/story-sleep.png'});
  assert.equal((await state()).x,240);
  assert.equal((await state()).y,240);
  assert.equal((await state()).hearts,3,'Sleep must restore all hearts');
  await tap('e');assert.equal((await state()).x,272);
  await move('s','y',432);await move('d','x',400);await move('s','y',464);
  await ready('DungeonScene');
  assert.equal((await state()).hearts,3,'Healing must persist outdoors');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).opening),'chase');
  // Seed the post-combat checkpoint to verify the rescue and downstream transitions.
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'chase',completedChapters:[],defeatedRoadEnemies:[0,1,2,3,4,5,6,7,8,9],chapterCheckpoints:{1:JSON.stringify({gates:[1,2,3],roadCleared:true})}})));
  await page.goto('http://localhost:3000/story/1?storyTest&roadReview=arrival');await ready('DungeonScene');
  await page.waitForFunction(()=>!!window.__storyTest.state()[0].dialogue);
  await page.waitForTimeout(900);
  await page.screenshot({path:'/tmp/story-rescue.png'});
  assert((await state()).dialogue.startsWith('Luma: Mum!'));
  assert.deepEqual((await state()).luma,{x:2640,y:272});
  for(let i=0;i<10;i++)await tap('e');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).opening),'scholar');
  await page.goto('http://localhost:3000/story/1?storyTest&interiorReview=archive');await ready('ArchiveScene');
  await move('d','x',432);await move('w','y',336);await move('d','x',464);
  await tap('e');assert((await state()).dialogue?.includes('Serif sent you'));
  await page.screenshot({path:'/tmp/story-scholar.png'});
  for(let i=0;i<8;i++)await tap('e');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).opening),'wordwood');
  await page.goto('http://localhost:3000/story/village?storyTest');await ready('DungeonScene');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).visitedInkwell),true);
  await page.goto('http://localhost:3000/story/1?storyTest&roadReview=arrival');await ready('DungeonScene');
  assert.deepEqual((await state()).residents,['Dame Copper']);
  assert.equal((await state()).luma,null);
  await move('d','x',2896);await tap('e');
  assert.equal((await state()).speech.speaker,'dame copper');
  assert((await state()).dialogue.includes('road watch'));
  await page.waitForTimeout(1000);await page.screenshot({path:'/tmp/story-road-watch.png'});
  await tap('e');await tap('e');assert.equal((await state()).speech.nod,0);
  assert.deepEqual(errors,[]);console.log('PASS: wake → move → Luma; seeded rescue → scholar mission. Screenshots in /tmp/story-*.png');
 }catch(error){console.error('URL',page.url(),'STATE',await state(),'ERRORS',errors);await page.screenshot({path:'/tmp/story-failure.png'});throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
