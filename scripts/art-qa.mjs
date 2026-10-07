import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.RIDE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await fs.mkdir('public/riders',{recursive:true});
for(const [type,id,path]of [['roster',0,'previews/23-new-rider-collection.png'],['rider',0,'previews/24-schoolboy-detail.png'],['rider',1,'previews/25-mango-rider.png'],['rider',2,'previews/26-pudding-rider.png'],['car',0,'previews/27-hatchback-detail.png'],['car',1,'previews/28-delivery-van-detail.png'],['car',3,'previews/29-taxi-detail.png']]){
  await page.goto(`${url}scripts/art-preview.html?type=${type}&id=${id}`);await page.waitForFunction(()=>window.__artReady);await page.screenshot({path});console.log(path);
}
await page.setViewportSize({width:320,height:320});
for(const [id,name]of ['lin','mango','pudding'].entries()){
  await page.goto(`${url}scripts/art-preview.html?type=rider&id=${id}&portrait=1`);await page.waitForFunction(()=>window.__artReady);await page.locator('canvas').screenshot({path:`public/riders/${name}.png`});
}
await page.setViewportSize({width:1440,height:900});await page.goto(url,{waitUntil:'networkidle'});await page.waitForTimeout(1100);await page.screenshot({path:'previews/30-japanese-street-menu.png'});console.log(await page.evaluate(()=>window.__ride.stats));assert.deepEqual(errors,[]);console.log({errors});
}finally{await browser.close();}
