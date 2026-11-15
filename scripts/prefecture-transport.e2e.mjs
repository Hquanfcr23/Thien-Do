import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {Buffer} from 'node:buffer';
import process from 'node:process';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>{errors.push(e.message);process.stderr.write(e.message+'\n');});page.on('console',m=>{if(m.type()==='error')process.stderr.write(m.text()+'\n');});
const url=process.env.MAP_TEST_URL||'http://127.0.0.1:5176/';
async function turn(){const b=page.getByRole('button',{name:'Tiến 1 lượt',exact:true});await b.click();await expect(b).toBeEnabled();}
async function exportGame(){await page.getByRole('button',{name:'Thư khố',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất JSON',exact:true}).click();const save=JSON.parse(await fs.readFile(await(await pending).path(),'utf8'));await page.getByRole('button',{name:'Đóng cửa sổ'}).click();return save;}
async function transport(){if(!await page.getByRole('navigation',{name:'Mục kinh tế'}).count())await page.getByRole('button',{name:'Kinh tế',exact:true}).click();await page.getByRole('navigation',{name:'Mục kinh tế'}).getByRole('button',{name:'Vận tải',exact:true}).click();}
try{
 await page.goto(url);await page.getByRole('button',{name:/Khởi lập triều đại/}).click();await page.getByRole('button',{name:'Nhận thiên mệnh',exact:true}).click();
 await transport();await expect(page.getByRole('heading',{name:'Vận tải liên Phủ',exact:true})).toBeVisible();
 const panel=page.getByRole('region',{name:'Vận tải Phủ'}),corridor=panel.locator(':scope > details').filter({hasText:'Giao thương tự động'}).first();
 await corridor.locator(':scope > summary').click();await expect(corridor.getByRole('button',{name:'Đóng cửa ngõ'}).first()).toBeVisible();
 await page.screenshot({path:'docs/screenshots/prefecture-transport.png',fullPage:true});
 await corridor.getByRole('button',{name:'Đóng cửa ngõ'}).first().click();await turn();await turn();
 const closed=await exportGame();expect(closed.state.simulation.routes.some(r=>r.blocked)).toBe(true);
 await transport();const reopen=panel.getByRole('button',{name:'Mở cửa ngõ'}).first();await expect(reopen).toBeVisible();await reopen.click();await turn();await turn();
 const opened=await exportGame();expect(opened.state.simulation.routes.filter(r=>r.blocked).length).toBe(closed.state.simulation.routes.filter(r=>r.blocked).length-1);
 await page.getByRole('button',{name:'Thư khố',exact:true}).click();await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu hồ sơ.');await page.getByRole('button',{name:'Đóng cửa sổ'}).click();
 await page.reload();await page.getByRole('button',{name:'Tiếp tục trị vì',exact:false}).click();const reloaded=await exportGame();expect(reloaded.state.simulation.shipments).toEqual(opened.state.simulation.shipments);
 await page.getByRole('button',{name:'Thư khố',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'transport-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(closed))});await expect(page.getByRole('dialog')).toHaveCount(0);expect((await exportGame()).state.simulation.routes).toEqual(closed.state.simulation.routes);
 await transport();await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(closed.state.administrativeUnits.find(u=>u.levelId==='xian').id);await expect(panel.getByRole('button',{name:/Cấp 1.600/})).toBeVisible();
 await panel.locator(':scope > details').filter({hasText:'Đường thu gom và phân phối nội Phủ'}).last().locator(':scope > summary').click();
 await page.setViewportSize({width:1280,height:800});await panel.getByRole('button',{name:/Cấp 1.600/}).scrollIntoViewIfNeeded();await page.screenshot({path:'docs/screenshots/prefecture-transport-local.png',fullPage:true});
 expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);expect(errors).toEqual([]);
 await fs.writeFile('docs/PREFECTURE_TRANSPORT_UI_QA.json',JSON.stringify({passed:true,viewports:['1600x1000','1280x800'],checks:['hub corridors','close and reopen gate','local feeder details','county relief','save/reload','export/import','no horizontal overflow','no page errors'],errors},null,2));
}catch(error){await page.screenshot({path:'docs/screenshots/prefecture-transport-error.png',fullPage:true});process.stderr.write((await page.locator('body').innerText()).slice(0,2500));throw error;}finally{await browser.close();}
