import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const url=process.env.RIDE_URL||'http://127.0.0.1:5183/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],report={riders:[],cars:[],errors};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const frame=async(phase,standing=0,rotation=0)=>page.evaluate(args=>window.__artFrame(...args),[phase,standing,rotation]);
try{
  for(const [id,name]of ['lin','mango','pudding'].entries()){
    await page.goto(`${url}scripts/art-preview.html?type=rider&id=${id}`);await page.waitForFunction(()=>window.__artReady);
    await frame(.9,0);const before=hash(await page.locator('canvas').screenshot());
    for(const standing of [0,.5,1])for(let i=0;i<12;i++)await frame(i*Math.PI/6,standing);
    await frame(.9,0);assert.equal(hash(await page.locator('canvas').screenshot()),before,'Block character returns to the identical seated pose after a full stand/pedal cycle');
    const metrics=await frame(.9,1);await page.screenshot({path:`previews/36-${name}-standing-detail.png`});report.riders.push({name,poses:36,...metrics});
  }
  for(let id=0;id<4;id++){
    await page.goto(`${url}scripts/art-preview.html?type=car&id=${id}`);await page.waitForFunction(()=>window.__artReady);
    await frame(0,0,0);const before=hash(await page.locator('canvas').screenshot());
    for(let i=0;i<32;i++)await frame(i*Math.PI/4,0,i*Math.PI/16);
    const metrics=await frame(0,0,0);assert.equal(hash(await page.locator('canvas').screenshot()),before,'Glazing remains deterministic across a complete camera/vehicle angle cycle');
    assert.ok(metrics.windows.every(p=>!p.cast&&!p.receive&&p.side===0));report.cars.push({id,poses:32,...metrics});
  }
  assert.deepEqual(errors,[]);await fs.writeFile('test-results/sculpt-quality.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
