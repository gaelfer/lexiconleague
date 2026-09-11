const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pos=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(600);};
 const keepers=()=>page.evaluate(()=>window.__storyTest.keeperState());
 const shot=async(name)=>page.screenshot({path:`/tmp/keepers-${name}.png`});
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({completedChapters:[1],wordwoodExpedition:{logGuardianFreed:true,tablet:true,maintenance:true,cleared:['store','maintenance']},chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],solved:true,echoOpen:true,found:[0]})}})));
  await page.goto('http://localhost:3000/story/2?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  await page.evaluate(()=>window.__storyTest.reviewKeepers('garden','tree'));await page.waitForTimeout(600);
  assert.equal((await keepers()).length,2);await pos(784,752);await shot('watering');
  await pos(336,368);await shot('chopping');await page.waitForTimeout(250);await shot('chopping-swing');
  await page.evaluate(()=>window.__storyTest.reviewKeepers('home','bridge'));await page.waitForTimeout(600);
  await pos(304,496);await shot('bridge');
  await page.evaluate(()=>window.__storyTest.reviewKeepers('home','home'));await page.waitForTimeout(600);
  assert.equal((await keepers()).length,0);
  for(const [room,x,y,kind] of [['store',1008,912,'gardener'],['maintenance',432,272,'bridgekeeper']]){
   await pos(x,y);await page.keyboard.press('w');
   await page.waitForFunction(r=>window.__storyTest.state()[0].room===r,room);
   assert.deepEqual(await keepers(),[{name:`keeper-${kind}`,activity:'home'}]);
   await pos(432,368);await shot(`${kind}-home`);
   await page.keyboard.press('e');await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>!!window.__storyTest.expeditionState().panel),false,'Caretaker speech does not open a large panel');
   await shot(`${kind}-speech`);
   await page.waitForTimeout(300);await page.keyboard.press('e');await page.waitForTimeout(300);
   if(kind==='gardener'){
    await page.evaluate(()=>window.__storyTest.reviewDialogue('First line.\nSecond line.\nThird line.\nFourth line.\nFifth line.'));
    const before=await page.evaluate(()=>window.__storyTest.expeditionState().panel);
    await page.mouse.wheel(0,300);await page.waitForTimeout(200);
    const after=await page.evaluate(()=>window.__storyTest.expeditionState().panel);
    assert.notDeepEqual(before,after,'Long speech scrolls within the fixed frame');
    await shot('scrolling-dialogue');
    for(let i=0;i<4&&await page.evaluate(()=>!!window.__storyTest.expeditionState().panel);i++){await page.waitForTimeout(250);await page.keyboard.press('e');await page.waitForTimeout(30);}
    await page.waitForTimeout(250);
   }
   await pos(400,432);await page.keyboard.press('s');
   await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
   assert.equal((await keepers()).length,0,'Returning from a room does not reroll home residents');
  }
  assert.deepEqual(errors,[]);console.log('PASS caretaker activities, both occupied homes, doorway travel and stable visit assignments');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
