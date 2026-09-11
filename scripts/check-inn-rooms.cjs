const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const step=async key=>{await page.keyboard.press(key);await page.waitForTimeout(260);};
 const move=async(axis,target)=>{
  for(let i=0;i<15;i++){
   const value=await page.evaluate(axis=>window.__storyTest.state()[0][axis],axis);
   if(Math.abs(value-target)<1)return;
   await step(axis==='x'?(value<target?'d':'a'):(value<target?'s':'w'));
  }
  throw Error(`Blocked walking to ${axis}=${target}`);
 };
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],visitedInkwell:true,innRoomBooked:true})));
  await page.goto('http://localhost:3000/story/village?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.hearts===3);
  for(const floor of [1,2])for(const room of [1,2,3]){
   await page.evaluate(({floor,room})=>window.__storyTest.reviewInnRoom(floor,room),{floor,room});
   await page.waitForFunction(({floor,room})=>{const s=window.__storyTest.state()[0];return s?.scene==='InnScene'&&s.floor===floor&&s.room===room;},{floor,room});
   await page.waitForTimeout(500);
   await step('w');
   const before=await page.evaluate(()=>window.__storyTest.innActivity());
   await page.screenshot({path:`/tmp/inn-new-${floor}0${room}.png`});
   const quiet=floor===1&&(room===2||room===3);
   if(!quiet){
   await page.waitForFunction(x=>window.__storyTest.innActivity().x!==x,before.x,{timeout:10000});
   await page.waitForFunction(activity=>window.__storyTest.innActivity().activity!==activity&&window.__storyTest.innActivity().activity!=='walking',before.activity);
   }
   const after=await page.evaluate(()=>window.__storyTest.innActivity());
   assert.equal(Math.abs(after.x-before.x),quiet?0:32);
   await page.screenshot({path:`/tmp/inn-active-${floor}0${room}.png`});
   await move('y',368);await move('x',after.x);await move('y',after.activity==='sleeping'?304:after.y===400?368:after.y+32);
   await step('e');
   assert((await page.evaluate(()=>window.__storyTest.state()[0])).dialogue,'Guest must remain talkable');
   await step('e');
   if(floor===2&&room===2){
    await move('y',336);await move('x',496);await move('y',272);await step('d');
    await page.evaluate(()=>window.__storyTest.takeTestHit());await step('e');
    await page.screenshot({path:'/tmp/inn-player-sleep.png'});
    await page.waitForFunction(()=>window.__storyTest.state()[0].dialogue?.includes('All hearts restored'));
    assert.equal(await page.evaluate(()=>window.__storyTest.state()[0].hearts),3);await step('e');
   }
   await move('y',368);await move('x',400);await move('y',400);await step('s');
   await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='InnScene'&&window.__storyTest.state()[0].room===undefined);
  }
  assert.deepEqual(errors,[]);console.log('PASS: six rooms, active and resting guests, player sleeping/healing, conversations and exits');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
