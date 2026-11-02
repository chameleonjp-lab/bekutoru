// Anonymous actual Canvas material only; all browser network is intercepted.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),origin='https://bekutoru.test';
(async()=>{
 const source=fs.readFileSync(path.join(root,'index.html'),'utf8'),marker='    preventMobileBrowserGestures();';
 assert.equal(source.split(marker).length,2);
 const html=source.replace(marker,'window.__capture=()=>({gameState,currentScreen,count:arrows.length,removed:removed.size,name:startedName});\n'+marker);
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:430,height:900},deviceScaleFactor:2,locale:'ja-JP',serviceWorkers:'block'}),forbidden=[],errors=[];
  await context.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url());
   if(u.origin===origin&&u.pathname==='/'&&['GET','HEAD'].includes(r.method()))return route.fulfill({contentType:'text/html;charset=utf-8',body:r.method()==='HEAD'?'':html});
   forbidden.push('unexpected-http');return route.abort('blockedbyclient');
  });
  await context.routeWebSocket('**/*',ws=>{forbidden.push('unexpected-websocket');ws.close();});
  await context.addInitScript(()=>{let seed=19;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);window.open=()=>null;});
  const page=await context.newPage();page.on('pageerror',()=>errors.push('pageerror'));
  await page.goto(origin+'/');await page.fill('#playerNameStartInput','');await page.click('#startButton');
  await page.waitForFunction(()=>__capture().gameState==='playing',{},{timeout:10000});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const state=await page.evaluate(()=>__capture());assert.equal(state.name,'');assert.equal(state.count,72);assert.equal(state.removed,0);
  const material=await page.evaluate(()=>{const c=document.querySelector('#gameCanvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let ink=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)ink++;return{png:c.toDataURL('image/png').split(',')[1],width:c.width,height:c.height,ink};});
  assert.ok(material.width>100&&material.height>100&&material.ink>1000);assert.deepEqual(forbidden,[]);assert.deepEqual(errors,[]);
  const out=path.join(root,'test-artifacts');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'bekutoru-real-board.png'),Buffer.from(material.png,'base64'));delete material.png;
  fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({...state,...material,seed:19,anonymous:true,externalRequests:0,source:'actual unmodified Canvas after normal anonymous start'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
