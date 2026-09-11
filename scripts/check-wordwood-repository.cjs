const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(20000);
 page.setDefaultNavigationTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>window.__storyTest.state()[0]);
 const exp=()=>page.evaluate(()=>window.__storyTest.expeditionState());
 const pos=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(100);};
 const room=async(name)=>{await page.waitForFunction(n=>window.__storyTest?.expeditionState().room===n,name);await page.waitForTimeout(500);};
 const close=async()=>{await page.waitForTimeout(300);await page.keyboard.press('e');await page.waitForFunction(()=>!window.__storyTest.expeditionState().panel);};
 const snap=async(name)=>{await page.waitForTimeout(350);await page.screenshot({path:`/tmp/wordwood-${name}.png`});};
 const spin=async(x,y)=>{await pos(x,y);await page.keyboard.down('q');await page.waitForTimeout(780);await page.keyboard.up('q');await page.waitForTimeout(650);};
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],found:[],solved:true,echoOpen:true})}})));
  await page.goto('http://localhost:3000/story/2?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');await page.waitForTimeout(700);
  await pos(432,272);await snap('workshop-exterior');await page.keyboard.press('w');await room('maintenance');await snap('workshop');
  await pos(528,240);await page.keyboard.press('e');await page.waitForTimeout(300);await page.keyboard.press('2');await close();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.maintenance));
  await pos(400,464);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  await page.waitForTimeout(550);await pos(432,272);await page.keyboard.press('w');await room('maintenance');
  await pos(400,464);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  await pos(1136,592);await snap('gallery-exterior');await page.keyboard.press('w');await room('gallery');await snap('gallery');
  await spin(400,336);await pos(400,208);await page.keyboard.press('w');await page.waitForTimeout(250);await page.keyboard.press('r');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition?.gallery);
  await close();await page.waitForTimeout(600);await pos(400,208);await page.keyboard.down('w');await page.waitForTimeout(450);await page.keyboard.up('w');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  await pos(1008,912);await snap('store-exterior');await page.keyboard.press('w');await room('store');await snap('store');
  await pos(336,336);await page.keyboard.press('e');await page.waitForTimeout(100);await page.keyboard.press('e');await pos(400,336);await page.keyboard.press('e');await close();
  await pos(400,208);await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  await pos(816,112);await snap('repository-terrace');
  await pos(816,112);await snap('gate-courtyard');await page.keyboard.press('w');await room('hall');await snap('hall-flooded');
  await pos(400,336);await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');assert.ok((await state()).y<304,'Workshop completion drains the Repository passage');
  await pos(176,336);await page.keyboard.press('a');await room('drain');await snap('sluice');
  await pos(528,240);await page.keyboard.press('e');await page.waitForTimeout(300);await page.keyboard.press('1');assert.ok((await exp()).panel);await page.waitForTimeout(250);await page.keyboard.press('2');await close();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.drained));
  await pos(624,336);await page.keyboard.press('d');await room('hall');await snap('hall-drained');
  await pos(624,336);await page.keyboard.press('d');await room('records');await snap('records');
  await spin(400,336);assert.equal((await exp()).enemies,0,'Sword spin defeats record guards');
  await pos(400,272);await page.keyboard.press('e');await close();await pos(176,336);await page.keyboard.press('a');await room('hall');
  await pos(400,208);await page.keyboard.press('w');await room('seal');await snap('seal');
  await pos(400,272);await page.keyboard.press('e');await page.waitForTimeout(300);await page.keyboard.press('3');await close();
  await pos(400,208);await page.keyboard.press('w');await room('vault');await snap('vault');
  // Aim from alternating axes so pillars cannot permanently shelter a guard.
  for(let i=0;i<30&&(await exp()).enemies;i++){
    const enemy=await page.evaluate(()=>window.__storyTest.combatState().enemies[0]);
    if(i%2){
      const right=enemy.x<400,x=Math.round((enemy.x+(right?96:-96)-16)/32)*32+16;
      const y=Math.round((enemy.y-16)/32)*32+16;
      await pos(Math.max(176,Math.min(624,x)),Math.max(208,Math.min(464,y)));
      await page.keyboard.press(right?'a':'d');await page.waitForTimeout(220);
      await page.keyboard.down('q');await page.waitForTimeout(50);await page.keyboard.up('q');await page.waitForTimeout(380);continue;
    }
    const x=Math.round((enemy.x-16)/32)*32+16;
    const below=enemy.y<352;
    const y=Math.round((enemy.y+(below?128:-128)-16)/32)*32+16;
    await pos(Math.max(176,Math.min(624,x)),Math.max(208,Math.min(464,y)));
    await page.keyboard.press(below?'w':'s');await page.waitForTimeout(220);await page.keyboard.press('r');await page.waitForTimeout(850);
  }
  assert.equal((await exp()).enemies,0,'Vault guards defeated');
  await pos(400,272);await page.keyboard.press('e');await page.waitForFunction(()=>window.__storyTest.expeditionState().locked);await snap('tablet-reward');
  await page.waitForFunction(()=>!!window.__storyTest.expeditionState().panel);await close();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:inventory')).keyItems.includes('wordwood-tablet')));
  await pos(400,464);await page.keyboard.press('s');await room('seal');
  await pos(400,464);await page.keyboard.press('s');await room('hall');
  await pos(400,464);await page.keyboard.press('s');await page.waitForFunction(()=>window.__storyTest.state()[0].scene==='WordwoodScene');
  await page.reload();await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.tablet));
  await page.goto('http://localhost:3000/story/1?storyTest&interiorReview=archive');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='ArchiveScene');await page.waitForTimeout(500);
  await pos(464,336);await page.keyboard.press('w');await page.waitForTimeout(250);await page.keyboard.press('e');
  await page.waitForFunction(()=>window.__storyTest.state()[0].dialogue?.includes('Wordwood Tablet'));
  await snap('bellum-tablet');
  for(let i=0;i<6;i++){await page.waitForTimeout(300);await page.keyboard.press('e');}
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.studied);
  assert.deepEqual(errors,[]);console.log('PASS: outdoor rooms, sluice, key, seal, combat, Tablet ceremony, exit and persistence');
 }catch(e){console.log('STATE',await state(),await exp(),errors);await page.screenshot({path:'/tmp/wordwood-error.png'});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
