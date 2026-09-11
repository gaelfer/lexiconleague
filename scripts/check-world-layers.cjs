const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>window.__storyTest.state()[0]);
 const position=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(500);};
 const move=async(axis,target)=>{
  for(let i=0;i<30;i++){const v=(await state())[axis];if(Math.abs(v-target)<1)return;
   await page.keyboard.press(axis==='x'?(v<target?'d':'a'):(v<target?'s':'w'));
   await page.waitForFunction(({axis,next})=>Math.abs(window.__storyTest.state()[0][axis]-next)<1,{axis,next:v+Math.sign(target-v)*32});
  }throw Error('Unreachable '+axis+' '+target);
 };
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],visitedInkwell:true,chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],found:[],solved:false})}})));
  await page.goto('http://localhost:3000/story/village?storyTest&exteriorReview=archive');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene');await page.waitForTimeout(1200);
  await page.screenshot({path:'/tmp/layer-archive.png'});
  await position(816,496);await page.screenshot({path:'/tmp/layer-cottage.png'});
  await position(880,656);await page.keyboard.press('w');await page.waitForTimeout(300);
  assert.equal((await state()).y,656,'House walls remain solid');
  await page.goto('http://localhost:3000/story/2?storyTest&sceneReview=stone');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');await page.waitForTimeout(1200);
  await position(432,400);await page.screenshot({path:'/tmp/layer-tree.png'});
  await position(432,496);await page.keyboard.press('w');await page.waitForTimeout(300);
  assert.equal((await state()).y,496,'Tree trunks remain solid');
  await position(816,656);await page.keyboard.press('e');
  await page.waitForFunction(()=>window.__storyTest.puzzleState().solved===true);
  assert.equal((await page.evaluate(()=>window.__storyTest.puzzleState())).notes,0);
  await page.waitForTimeout(300);await page.keyboard.press('e');
  await move('x',688);await move('y',720);await move('y',752);
  await move('x',944);await move('y',720);await move('y',752);
  await move('x',816);await move('y',720);
  await page.waitForFunction(()=>window.__storyTest.puzzleState().open===true);
  const puzzle=await page.evaluate(()=>window.__storyTest.puzzleState());
  assert.equal(puzzle.gateBlocked,false);assert.match(puzzle.feedback,/newly opened/);
  await position(816,208);await page.screenshot({path:'/tmp/wordwood-open-gate.png'});
  await page.goto('http://localhost:3000/story/1?storyTest&roadReview=camp');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene');await page.waitForTimeout(1200);
  await page.screenshot({path:'/tmp/layer-road.png'});
  assert.deepEqual(errors,[]);console.log('PASS: zero-note solution, verse opens gate, foreground screenshots');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
