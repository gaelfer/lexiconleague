// Isolated browser save; exercises actual movement, booking, locked door and rest.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>window.__storyTest?.state()[0]);
 const ready=async(scene,floor,room)=>{
   await page.waitForFunction(({scene,floor,room})=>{const s=window.__storyTest?.state()[0];return s?.scene===scene&&(floor===undefined||s.floor===floor)&&s.room===room;},{scene,floor,room});
   await page.waitForTimeout(350);
 };
 const tap=async key=>{await page.keyboard.press(key);await page.waitForTimeout(260);};
 const move=async(axis,target)=>{
   for(let i=0;i<45;i++){
     const s=await state(),value=s[axis];if(Math.abs(value-target)<1)return;
     const dir=Math.sign(target-value),key=axis==='x'?(dir>0?'d':'a'):(dir>0?'s':'w');
     const next=value+dir*32;
     await page.keyboard.press(key);
     await page.waitForFunction(({axis,next})=>Math.abs(window.__storyTest.state()[0][axis]-next)<.01,{axis,next},{timeout:6000});
   }
   throw Error('Movement did not reach '+target);
 };
 const desk=async()=>{await move('y',432);await move('x',304);await move('y',400);await tap('e');};
 const stairs=async floor=>{await move('y',432);await move('x',496);await tap('e');await ready('InnScene',floor);};
 const middleDoor=async()=>{await move('y',272);await move('x',400);await tap('e');};
 const greet=async name=>{
   await move('y',368);
   const guest=await page.evaluate(()=>window.__storyTest.innActivity());
   await move('x',Math.round((guest.x-16)/32)*32+16);await move('y',guest.activity==='sleeping'?304:guest.y===400?368:guest.y+32);await tap('e');
   assert((await state()).dialogue.startsWith(name));
   if(name!=='Rue')assert.equal((await state()).speech.speaker,name.toLowerCase());
   await page.screenshot({path:`/tmp/inn-resident-${name.toLowerCase()}.png`});
   await tap('e');await move('y',368);await move('x',400);await move('y',432);
 };
 try{
   await page.goto('http://localhost:3000/story');
   await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],visitedInkwell:true})));
   await page.goto('http://localhost:3000/story/village?storyTest');await ready('DungeonScene');
   await move('y',1296);await move('x',816);
   await page.screenshot({path:'/tmp/inn-exterior.png'});
   await tap('e');await ready('InnScene',1);
   await page.screenshot({path:'/tmp/inn-reception.png'});
   await desk();assert((await state()).dialogue.includes('1 — Get a room'));
   await tap('2');assert((await state()).dialogue.includes('boots get tired'));await tap('e');
   await stairs(2);await middleDoor();assert((await state()).dialogue.startsWith('Locked.'));
   await page.screenshot({path:'/tmp/inn-locked.png'});await tap('e');
   for(const x of [240,304,368,432,496,560]){
     await move('x',x);await tap('w');assert.equal((await state()).y,272,'The north wall must block walking beside room doors');
   }
   await move('x',400);await page.screenshot({path:'/tmp/inn-upstairs-wall.png'});
   await stairs(1);await desk();await tap('1');assert((await state()).dialogue.includes('Here’s your key'));
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).innRoomBooked),true);
   await tap('e');await stairs(2);await middleDoor();await ready('InnScene',2,2);
   await page.screenshot({path:'/tmp/inn-room-202.png'});
   await greet('Fern');
   await page.evaluate(()=>window.__storyTest.takeTestHit());assert.equal((await state()).hearts,2);
   await move('y',336);await move('x',496);await move('y',272);await tap('d');await tap('e');
   await page.waitForFunction(()=>window.__storyTest.state()[0].dialogue?.includes('All hearts restored'));
   assert((await state()).dialogue.includes('All hearts restored'));assert.equal((await state()).hearts,3);await tap('e');
   await move('x',400);await move('y',432);await tap('e');await ready('InnScene',2);
   await move('x',272);await tap('e');await ready('InnScene',2,1);
   await greet('Tobin');
   await tap('e');await ready('InnScene',2);
   await move('x',528);await tap('e');await ready('InnScene',2,3);
   await greet('Ada');
   await tap('e');await ready('InnScene',2);
   await move('x',496);await move('y',432);await tap('e');await ready('InnScene',1);
   for(const [room,x] of [[1,272],[2,400],[3,528]]){
     await move('x',400);await move('y',272);await move('x',x);await tap('e');await ready('InnScene',1,room);
     await greet(['Hazel','Moss','Rue'][room-1]);
     await tap('e');await ready('InnScene',1);
   }
   await move('x',400);await move('y',432);await tap('e');await ready('DungeonScene');assert.equal((await state()).hearts,3);
   await page.reload();await ready('DungeonScene');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).innRoomBooked),true);
   await move('y',656);await move('x',272);await tap('e');await ready('VillageInteriorScene');
   await move('x',464);await move('y',368);await tap('e');
   assert((await state()).dialogue.includes('crooked rolls'));
   await page.screenshot({path:'/tmp/nell-house.png'});await tap('e');await tap('e');
   await move('y',432);await move('x',400);await tap('e');await ready('DungeonScene');
   await move('x',656);await move('y',976);await move('x',1072);await tap('e');await ready('VillageInteriorScene');
   await move('x',464);await move('y',368);await tap('e');
   assert((await state()).dialogue.includes('front door myself'));
   await page.screenshot({path:'/tmp/oren-house.png'});
   assert.deepEqual(errors,[]);console.log('PASS: decline, locked 202, accept, all six rooms, sleep, exit, persistent booking.');
 }catch(e){console.error(await state(),errors);await page.screenshot({path:'/tmp/inn-failure.png'});throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
