import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],report={samples:[],checks:[]};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const stats=()=>page.evaluate(()=>window.__ride.stats);
async function animationClip(name){
  const base64=await page.evaluate(async()=>{
    const stream=document.querySelector('#world canvas').captureStream(24),chunks=[];
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    return await new Promise((resolve,reject)=>{recorder.onerror=reject;recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:mime}));};recorder.start();setTimeout(()=>recorder.stop(),4500);});
  });
  await fs.writeFile(`previews/${name}.webm`,Buffer.from(base64,'base64'));
}
async function environment(map,time='day',weather='clear'){
  await page.locator('[data-action="environment"]').click();for(const [key,value]of Object.entries({map,time,weather}))await page.locator(`#modal-layer [data-action="${key}"][data-value="${value}"]`).click();await page.locator('[data-action="close"]').last().click();
}
try{
  await page.goto(process.env.RIDE_URL||'http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  for(const map of ['coast','forest']){
    await environment(map);await page.waitForTimeout(1300);const a=await stats();await page.waitForTimeout(450);const b=await stats();
    assert.equal(b.traffic.length,0);assert.equal(b.pedestrians.length,0);assert.equal(b.nature.pathWidth,3.8);
    assert.ok(b.nature.windTime>a.nature.windTime);
    if(map==='coast'){assert.equal(b.nature.ocean,true);assert.equal(b.nature.palms,12);assert.equal(b.nature.cabins,0);assert.ok(b.nature.waveTime>a.nature.waveTime);}
    else{assert.equal(b.nature.ocean,false);assert.equal(b.nature.cabins,2);assert.equal(b.nature.animals.length,16);assert.ok(['deer','rabbit','squirrel'].every(kind=>b.nature.animals.some(a=>a.kind===kind)));assert.notDeepEqual(b.nature.animals,a.nature.animals);}
    await page.screenshot({path:`previews/${map==='coast'?'15-hawaiian-beach-menu':'17-forest-cabin-menu'}.png`});
    await page.locator('[data-action="mode"][data-value="endless"]').click();await page.locator('#menu [data-action="start"]').click();await page.waitForFunction(()=>window.__ride.game.phase==='playing');
    for(let i=0;i<3;i++){const word=await page.evaluate(()=>window.__ride.game.word.text);await page.locator('#typing-input').pressSequentially(word,{delay:40});}
    await page.waitForTimeout(700);await page.screenshot({path:`previews/${map==='coast'?'16-hawaiian-beach-ride':'18-forest-wildlife-ride'}.png`});
    const moving=await stats();report.samples.push({map,...moving});if(process.env.NATURE_VIDEO)await animationClip(map==='coast'?'21-beach-breeze':'22-forest-life');await page.keyboard.press('Escape');await page.waitForTimeout(200);const frozen=await stats();await page.waitForTimeout(450);const frozenAfter=await stats();
    assert.deepEqual(frozenAfter.nature,frozen.nature,'Pause freezes wind, waves, smoke and wildlife');
    // A map switch through settings keeps the current typing progress intact.
    const progress=await page.evaluate(()=>window.__ride.game.correct);
    await page.locator('[data-action="close"]').last().click();await environment(map==='coast'?'forest':'coast');assert.equal(await page.evaluate(()=>window.__ride.game.correct),progress);
    await page.keyboard.press('Escape');await page.locator('[data-action="end-ride"]').click();await page.waitForFunction(()=>window.__ride.screen==='result');await page.keyboard.press('Escape');
  }
  await environment('coast','sunset');await page.waitForTimeout(900);await page.screenshot({path:'previews/19-beach-sunset.png'});
  await environment('forest','night','rain');await page.waitForTimeout(900);await page.screenshot({path:'previews/20-cabin-rainy-night.png'});
  // Warm every theme before checking several complete replacement cycles.
  for(const map of ['town','coast','forest'])await environment(map);await page.waitForTimeout(500);const before=await stats();
  for(let i=0;i<3;i++)for(const map of ['town','coast','forest']){await environment(map);await page.waitForTimeout(80);}
  await page.waitForTimeout(500);const after=await stats();assert.ok(after.geometries<=before.geometries+3,`Geometry grew ${before.geometries} -> ${after.geometries}`);assert.ok(after.textures<=before.textures+2);
  report.checks=['Beach cycle path, ocean waves, swaying palms and beach props; no cars, road markings or houses','Forest cabin pair, chimney smoke and sixteen animated deer, rabbits and squirrels','Pause freezes nature animation and map changes preserve the typed progress','Repeated map changes release replaced scenery geometry'];
  report.resources={before:{geometries:before.geometries,textures:before.textures},after:{geometries:after.geometries,textures:after.textures}};
  report.errors=errors;assert.deepEqual(errors,[]);await fs.writeFile('test-results/nature-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,samples:report.samples.map(s=>({map:s.map,fps:s.fps,drawCalls:s.drawCalls,triangles:s.triangles})),resources:report.resources,errors},null,2));
}finally{await browser.close();}
