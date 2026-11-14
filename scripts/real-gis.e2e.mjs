/* global document */
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import process from 'node:process';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out='docs/screenshots';await fs.mkdir(out,{recursive:true});
const report={clicks:[],zooms:[],camera:null,errors};
async function shot(name){await page.screenshot({path:`${out}/real-gis-${name}.png`,fullPage:true});await page.getByRole('region',{name:'Bản đồ hành chính Đại Ninh'}).screenshot({path:`${out}/real-gis-${name}-region.png`});}
async function labelsAt(name){
 await page.evaluate(()=>document.fonts.ready);
 const result=await page.locator('[data-testid="map-label"]').evaluateAll(elements=>{
  const labels=elements.map(e=>({text:e.textContent,kind:e.getAttribute('data-kind'),r:e.getBoundingClientRect()}));
  const overlaps=[];
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];const w=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),h=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(w>1&&h>1)overlaps.push([a.text,b.text,w*h]);}
  return{labels:labels.map(e=>({text:e.text,kind:e.kind})),overlaps};
 });
 expect(result.overlaps,`${name}: label overlap`).toEqual([]);expect(result.labels.length).toBeGreaterThan(0);report.zooms.push({name,...result});await shot(name);
 expect(result.labels.map(label=>label.text).join(' ')).not.toMatch(/Beijing|Chengdu|Zhengzhou|Nanjing|Shanghai|Guangzhou|Luoyang|Wuhan|Xi.?an/i);
}
try{
 await page.goto(process.env.MAP_TEST_URL||'http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await page.getByRole('button',{name:'Nhận thiên mệnh',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Sơn hà đồ',exact:true})).toBeVisible();
 await expect(page.getByTestId('map-camera')).not.toHaveAttribute('transform','translate(0 0) translate(700 425) scale(1) translate(-700 -425)');
 await labelsAt('far'); await page.getByRole('button',{name:'Toàn cảnh Trung Hoa'}).click(); await shot('china'); await page.getByRole('button',{name:'Reset View'}).click();
 const targets=[['zhou','zhou-trung-ninh',3],['fu','zhou-trung-ninh-fu-1',7],['xian','zhou-trung-ninh-fu-1-jun-1-xian-2',24]];
 for(const[level,id,count]of targets){
  const close=page.getByRole('button',{name:'Đóng bảng quản lý',exact:true});if(await close.count()){await close.click();await page.waitForTimeout(250);}
  await page.getByRole('combobox',{name:'Cấp bản đồ'}).selectOption(level);
  await expect(page.getByRole('group',{name:'Lãnh thổ hành chính'}).getByRole('button')).toHaveCount(count);
  const target=page.getByTestId(`territory-${id}`),name=await target.getAttribute('aria-label');
  const point=await target.evaluate(el=>{const r=el.getBoundingClientRect();for(let row=1;row<20;row++)for(let col=1;col<20;col++){const x=r.left+r.width*col/20,y=r.top+r.height*row/20;if([-3,0,3].every(dx=>[-3,0,3].every(dy=>document.elementFromPoint(x+dx,y+dy)===el)))return{x,y};}return null;});
  expect(point,`visible interior point ${id}`).not.toBeNull();await page.mouse.click(point.x,point.y);
  await expect(page.getByRole('article',{name:'Thông tin lãnh thổ'}).getByRole('heading',{name,exact:true})).toBeVisible();report.clicks.push({level,id,name,count});
 }
 // Return to the full campaign, then examine distinct zoom tiers without panning away.
 await page.getByRole('combobox',{name:'Cấp bản đồ'}).selectOption('fu');await page.getByRole('button',{name:'Reset View'}).click();
 for(let i=0;i<1;i++)await page.getByRole('button',{name:'Phóng to bản đồ'}).click();await labelsAt('middle');
 await page.getByRole('combobox',{name:'Cấp bản đồ'}).selectOption('xian');
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'Phóng to bản đồ'}).click();await labelsAt('near');
  for(const [dx,dy] of [[600,0],[-600,0],[0,600],[0,-600]]){for(let n=0;n<4;n++){await page.mouse.move(550,450);await page.mouse.down();await page.mouse.move(550+dx,450+dy,{steps:12});await page.mouse.up();}const visible=await page.getByTestId('playable-outline').evaluate(el=>{const a=el.getBoundingClientRect(),s=el.ownerSVGElement.getBoundingClientRect();return a.right>s.left+100&&a.left<s.right-375&&a.bottom>s.top+150&&a.top<s.bottom-60;});expect(visible).toBe(true);}
 await page.mouse.move(550,450);await page.mouse.wheel(0,700);await page.waitForTimeout(120);const wheelOut=await page.getByTestId('map-camera').getAttribute('transform');await page.mouse.wheel(0,-700);await page.waitForTimeout(120);expect(await page.getByTestId('map-camera').getAttribute('transform')).not.toBe(wheelOut);report.pan='four repeated directions, playable visible';report.wheel='changes camera';
 await page.setViewportSize({width:1280,height:800});await page.getByRole('button',{name:'Reset View'}).click();await shot('resized');await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Reset View'}).click();
 const snapshot={camera:await page.getByTestId('map-camera').getAttribute('transform'),level:await page.getByRole('combobox',{name:'Cấp bản đồ'}).inputValue()};
 await page.getByRole('button',{name:'Thư khố',exact:true}).click();await page.getByRole('combobox',{name:'Ô lưu'}).selectOption('manual-3');await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu hồ sơ.');
 await page.reload();await page.getByRole('button',{name:'Tiếp tục trị vì',exact:false}).click();await expect(page.getByTestId('map-camera')).toHaveAttribute('transform',snapshot.camera);await expect(page.getByRole('combobox',{name:'Cấp bản đồ'})).toHaveValue(snapshot.level);await expect(page.getByTestId('territory-zhou-trung-ninh-fu-1-jun-1-xian-2')).toHaveAttribute('aria-pressed','true');report.camera='restored exactly';report.selection='restored';report.resize='1280x800 and 1440x1000';report.reset='returns fitted camera';
 expect(errors).toEqual([]);await fs.writeFile('docs/REAL_GIS_RESULTS.json',JSON.stringify(report,null,2));
}finally{await browser.close();}


