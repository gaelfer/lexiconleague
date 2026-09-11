const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://localhost:3001/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({found:[0]})}})));
  await page.goto('http://localhost:3001/story/2?arrival=gatehouse&storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  assert.equal((await page.evaluate(()=>window.__storyTest.state()[0])).y,2224);
  assert.equal((await page.evaluate(()=>window.__storyTest.combatState())).enemies.length,3);
  await page.waitForTimeout(500);await page.screenshot({path:'/tmp/wordwood-approach-gate.png'});
  // Clear each blotling with the actual bow before the route traversal.
  for(let remaining=3;remaining>0;remaining--){
   const enemy=(await page.evaluate(()=>window.__storyTest.combatState())).enemies[0];
   await page.evaluate(({x,y})=>window.__storyTest.reviewPosition(x-192,y),enemy);await page.keyboard.press('d');await page.waitForTimeout(250);
   for(let shot=0;shot<3;shot++){await page.keyboard.press('r');await page.waitForTimeout(650);}
   assert.equal((await page.evaluate(()=>window.__storyTest.combatState())).enemies.length,remaining-1);
  }
  await page.evaluate(()=>window.__storyTest.reviewPosition(144,2224));
  // Walk the full connecting trail using committed tile steps.
  const points=[[496,2224],[496,2128],[592,2128],[592,2032],[688,2032],[688,1808],[688,1552],[752,1552],[752,1456],[816,1456],[816,1104],[816,1008]];
  for(const [x,y] of points){
   let p=await page.evaluate(()=>window.__storyTest.state()[0]);
   while(Math.abs(p.x-x)>1||Math.abs(p.y-y)>1){
    const dx=Math.abs(x-p.x)>1?Math.sign(x-p.x)*32:0,dy=dx?0:Math.sign(y-p.y)*32,key=dx>0?'d':dx<0?'a':dy>0?'s':'w',target={x:Math.round(p.x)+dx,y:Math.round(p.y)+dy};
    await page.keyboard.press(key);await page.waitForFunction(({x,y})=>{const p=window.__storyTest.state()[0];return Math.abs(p.x-x)<.1&&Math.abs(p.y-y)<.1;},target,{timeout:3000});p=await page.evaluate(()=>window.__storyTest.state()[0]);
   }
   if(y===2032&&x===688)await page.screenshot({path:'/tmp/wordwood-approach-bend.png'});
   if(y===1808&&x===688){await page.screenshot({path:'/tmp/wordwood-approach-river.png'});await page.keyboard.press('m');await page.getByRole('button',{name:'Map',exact:true}).click();await page.getByRole('combobox').selectOption('wordwood-trail');await page.screenshot({path:'/tmp/wordwood-trail-chart.png',animations:'disabled'});await page.keyboard.press('Escape');}
  }
  await page.screenshot({path:'/tmp/wordwood-approach-entry.png'});
  await page.keyboard.press('m');await page.getByRole('button',{name:'Map',exact:true}).click();await page.getByRole('combobox').selectOption('wordwood');await page.screenshot({path:'/tmp/wordwood-approach-map.png',animations:'disabled'});await page.keyboard.press('Escape');
  // Actual threshold movement back into the shared gatehouse.
  await page.evaluate(()=>window.__storyTest.reviewPosition(144,2224));await page.keyboard.down('w');await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='GatehouseScene');await page.keyboard.up('w');
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('lexiconleague:story:progress'));p.chapterCheckpoints[2]=JSON.stringify({found:[]});localStorage.setItem('lexiconleague:story:progress',JSON.stringify(p));});
  await page.goto('http://localhost:3001/story/2?arrival=gatehouse&storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  assert.equal((await page.evaluate(()=>window.__storyTest.expeditionState())).panel,undefined);
  await page.evaluate(()=>window.__storyTest.reviewPosition(816,1072));assert.equal((await page.evaluate(()=>window.__storyTest.expeditionState())).panel,undefined);
  await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.expeditionState().panel?.some(text=>text.includes('WORDWOOD CLEARING')));
  await page.screenshot({path:'/tmp/wordwood-clearing-intro.png'});
  for(let i=0;i<20&&(await page.evaluate(()=>window.__storyTest.expeditionState())).panel;i++){await page.waitForTimeout(300);await page.keyboard.press('e');}
  await page.waitForFunction(()=>!window.__storyTest.expeditionState().panel);
  await page.evaluate(()=>window.__storyTest.reviewPosition(816,944));await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>window.__storyTest.expeditionState())).panel,undefined);
  assert.deepEqual(errors,[]);console.log('PASS: gate arrival, three blotlings, full trail traversal, return gate, and introduction only at the clearing without repeating.');
 }catch(e){await page.screenshot({path:'/tmp/wordwood-approach-failure.png'});console.error(await page.evaluate(()=>window.__storyTest?.state()));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
