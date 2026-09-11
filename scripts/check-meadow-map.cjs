/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3001/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1,2],visitedInkwell:true,northernStory:{escort:true}})));
  await page.goto('http://localhost:3001/story/1?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene',null,{timeout:20000}).catch(async error=>{console.log(await page.evaluate(()=>({url:location.href,state:window.__storyTest?.state(),text:document.body.innerText})));throw error;});
  await page.getByRole('button',{name:'Open adventure menu'}).click();
  await page.getByRole('button',{name:'Map',exact:true}).click();
  const chart=page.getByRole('combobox');
  await chart.selectOption('northmeadow');
  await page.getByRole('img',{name:'Northmeadow grassland and four-floor watchtower map'}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Northmeadow|Back to region chart/}).count(),0);
  await page.screenshot({path:'/tmp/meadow-integrated-map.png'});
  await chart.selectOption('region');
  await page.getByRole('img',{name:'Inkwell region pixel-art map'}).waitFor();
  await chart.selectOption('road');
  await page.getByRole('img',{name:'Inkwell Road pixel-art map'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS meadow uses shared Chart selector; region and road remain accessible');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
