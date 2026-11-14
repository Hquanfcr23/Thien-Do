import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import process from 'node:process';
import {Buffer} from 'node:buffer';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},acceptDownloads:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(async()=>{const {useGameStore}=await import('/src/state/gameStore.ts');return useGameStore.getState().game;});
async function step(){const button=page.getByRole('button',{name:'Tiến 1 tháng',exact:true}),before=await page.locator('.imperial-date strong').innerText();await button.click();await expect(page.locator('.imperial-date strong')).not.toHaveText(before);await expect(button).toBeEnabled();const annual=page.getByRole('button',{name:'Tiếp tục ngự lãm'});if(await annual.count())await annual.click();}
async function selectSite(id){await page.getByRole('button',{name:'Kinh tế',exact:true}).click();await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(id);await page.getByRole('button',{name:'Xây dựng',exact:true}).click();}
async function exportFile(){await page.getByRole('button',{name:'Thư khố',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất JSON',exact:true}).click();const data=JSON.parse(await fs.readFile(await(await pending).path(),'utf8'));return data;}
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5201/');
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await page.getByRole('button',{name:'Nhận thiên mệnh'}).click();
 await expect(page.locator('.empire-resource').first()).toContainText('48.000');
 const original=await state(),fu=Object.keys(original.simulation.prefectures)[0],id=original.simulation.prefectures[fu].seatCountyId;
 // Controlled QA inventory/working capital only; geographic routes and their actual lengths stay intact.
 await page.evaluate(async()=>{const {useGameStore}=await import('/src/state/gameStore.ts');const s=globalThis.structuredClone(useGameStore.getState().game);for(const f of Object.values(s.simulation.prefectures)){f.treasury=20000;f.fiscalPolicy.cashBufferMonths=0;f.fiscalPolicy.autoSell=false;for(const g of Object.keys(f.market.inventory))f.market.inventory[g]=10000;}useGameStore.getState().replaceGame(s);});
 await selectSite(id);
 const kind=page.getByRole('combobox',{name:'Loại công trình'});
 await expect(kind.locator('option')).toHaveCount(7);
 await kind.selectOption('granary');await expect(page.getByText('Kho công chỉ xây ở Phủ',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Xếp lệnh xây dựng'})).toBeDisabled();
 await kind.selectOption('farm');await expect(page.getByText(/Nhân công 1.440 lượng · 1.200 công-tháng/)).toBeVisible();await expect(page.getByText('2.400 lượng',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Xếp lệnh xây dựng'}).click();await step();
 let current=await state();expect(current.simulation.counties[id].projects[0]).toMatchObject({building:'farm',required:1200,costScale:1,work:400});
 const inProgress=current.simulation.counties[id].projects[0];
 const exported=await exportFile();expect(exported.state.simulation.counties[id].projects[0]).toEqual(inProgress);
 await page.locator('input[type=file]').setInputFiles({name:'core-construction.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.reload();await page.getByRole('button',{name:/Tiếp tục trị vì/}).click();current=await state();expect(current.simulation.counties[id].projects[0]).toEqual(inProgress);
 await selectSite(id);await step();await step();current=await state();expect(current.simulation.counties[id].buildings.farm.level).toBe(1);
 await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('farm');
 await expect(page.getByText(/Nhân công 2.160 lượng · 1.800 công-tháng · bảo trì sau nâng cấp 15 lượng/)).toBeVisible();const market=current.simulation.prefectures[fu].market.prices;const expectedBill=((270+45*market.wood+7.5*market.tools)*8).toLocaleString('vi-VN',{maximumFractionDigits:0})+' lượng';await expect(page.getByText(expectedBill,{exact:true})).toBeVisible();
 await page.screenshot({path:'docs/screenshots/core-building-tier2.png',fullPage:true});
 await page.getByRole('button',{name:'Xếp lệnh xây dựng'}).click();for(let m=0;m<5;m++)await step();current=await state();expect(current.simulation.counties[id].buildings.farm.level).toBe(2);
 await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('road');
 const routes=page.getByRole('combobox',{name:'Tuyến cần nâng cấp'});await expect(routes).toBeVisible();const routeId=await routes.inputValue();expect(routeId).toBeTruthy();
 await expect(page.locator('.building-effect-details')).toContainText('25%/45%/60%');
 await page.screenshot({path:'docs/screenshots/core-route-quote.png',fullPage:true});
 await page.getByRole('button',{name:'Xếp lệnh xây dựng'}).click();await step();current=await state();expect(current.simulation.counties[id].projects.find(p=>p.routeId===routeId)).toBeTruthy();
 // A true pre-update v6 shape: legacy level five, old prepaid work and a queued hidden type.
 const legacy=globalThis.structuredClone(exported);delete legacy.state.simulation.buildingRules;
 legacy.state.simulation.counties[id].buildings.farm={level:5,condition:.8};
 legacy.state.simulation.counties[id].projects=[{building:'bridge',work:120,required:900,materials:{grain:0,wood:10,stone:0,ore:0,iron:0,tools:0,fiber:0,cloth:0,equipment:0},legacyFunded:true,pausedReason:null}];
 legacy.state.simulation.orders=[{kind:'build',countyId:id,building:'market'}];
 await page.getByRole('button',{name:'Thư khố',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'legacy-buildings-v6.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});await expect(page.getByRole('dialog')).toHaveCount(0);
 await selectSite(id);current=await state();expect(current.simulation.counties[id].buildings.farm).toMatchObject({level:5,condition:.8,legacy:true});expect(current.simulation.counties[id].projects[0]).toEqual(legacy.state.simulation.counties[id].projects[0]);
 await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('farm');await expect(page.getByText(/Đã đạt giới hạn 3 cấp/)).toBeVisible();await expect(page.getByRole('button',{name:'Xếp lệnh xây dựng'})).toBeDisabled();
 await expect(page.getByText(/Giữ tiến độ và định mức công trình cũ/)).toBeVisible();await page.screenshot({path:'docs/screenshots/core-legacy-buildings.png',fullPage:true});
 await step();current=await state();expect(current.simulation.counties[id].projects.find(p=>p.building==='bridge').work).toBeGreaterThan(120);expect(current.simulation.counties[id].projects.some(p=>p.building==='market')).toBe(true);
 await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(fu);await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('granary');await expect(page.locator('.building-effect-details')).toContainText('40.000 thạch lương');await expect(page.getByRole('button',{name:'Xếp lệnh xây dựng'})).toBeEnabled();
 await expect(page.getByRole('combobox',{name:'Loại công trình'}).locator('option')).toHaveCount(7);
 expect(errors).toEqual([]);
 await fs.writeFile('docs/CORE_BUILDINGS_BROWSER.json',JSON.stringify({passed:true,checks:['seven kinds','location restriction','tier-1 bill and finite progress','JSON export/import','autosave reload','tier-2 bill and maintenance','completion','real-route selection and order','legacy level five','legacy prepaid project resumes','legacy queued build retained','Phủ warehouse'],errors,fixture:'Only working capital and material stocks enlarged for QA; geography untouched'},null,2));
}finally{await browser.close();}
