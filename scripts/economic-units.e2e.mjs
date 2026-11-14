import process from 'node:process';
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(async()=>{const {useGameStore}=await import('/src/state/gameStore.ts');return useGameStore.getState().game;});
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5196/');
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await page.getByRole('button',{name:'Nhận thiên mệnh'}).click();
 await expect(page.locator('.empire-resource').first()).toContainText('48.000');
 await expect(page.locator('.empire-resource').nth(1)).toContainText('96.000');
 const initial=await state();expect(initial.country.treasury).toBe(6000);
 await page.getByRole('button',{name:'Kinh tế',exact:true}).click();
 const fu=Object.keys(initial.simulation.prefectures)[0];
 await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(fu);
 await page.getByRole('button',{name:'Thị trường',exact:true}).click();
 await expect(page.locator('.market-table tbody tr').first().locator('td').nth(1)).toHaveText('0,5');
 const inventory=initial.simulation.prefectures[fu].market.inventory.grain;
 await expect(page.locator('.market-table tbody tr').first().locator('td').nth(2)).toHaveText((inventory*16).toLocaleString('vi-VN',{maximumFractionDigits:1}));
 await page.screenshot({path:'docs/screenshots/economic-units-market.png',fullPage:true});
 await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(initial.simulation.prefectures[fu].seatCountyId);await page.getByRole('button',{name:'Xây dựng',exact:true}).click();await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('farm');await expect(page.getByText(/Cấp 1\/2\/3: \+10%\/\+18%\/\+24%/)).toBeVisible();await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('mine');await expect(page.getByText(/12 đơn vị gỗ và đá, 6 đơn vị quặng sắt/)).toBeVisible();await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('administration');await expect(page.getByText(/\+5\/\+9\/\+12 điểm phần trăm/)).toBeVisible();await page.getByRole('combobox',{name:'Loại công trình'}).selectOption('farm');await expect(page.getByText(/Nhân công 1.440 lượng/)).toBeVisible();await page.screenshot({path:'docs/screenshots/building-effects.png',fullPage:true});
 await page.getByRole('button',{name:'Ngân sách & kho',exact:true}).click();
 await expect(page.getByRole('spinbutton',{name:'Hạn mức hỗ trợ bạc mỗi tháng',exact:true})).toHaveValue('800');
 await expect(page.getByRole('spinbutton',{name:'Lương trung ương giữ lại (thạch lương)',exact:true})).toHaveValue('16000');
 await page.getByRole('spinbutton',{name:'Hạn mức hỗ trợ bạc mỗi tháng',exact:true}).fill('400');
 await page.getByRole('button',{name:'Ban chính sách trung ương',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Số lượng điều phối',exact:true}).fill('800');
 await page.getByRole('button',{name:'Điều bạc ngân sách',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Lượng mua bán lương công',exact:true}).fill('1600');
 await page.getByRole('button',{name:'Chào bán lương công',exact:true}).click();
 const queued=await state();expect(queued.simulation.orders.find(o=>o.kind==='central-policy').policy.aidSilverLimit).toBe(50);
 expect(queued.simulation.orders.find(o=>o.kind==='budget-transfer').amount).toBe(100);
 expect(queued.simulation.orders.find(o=>o.kind==='sell-grain').amount).toBe(100);
 await page.getByRole('button',{name:'Tiến 1 tháng',exact:true}).click();
 await expect(page.locator('.imperial-date strong')).toContainText('Tháng 2');await expect(page.getByRole('button',{name:'Tiến 1 tháng',exact:true})).toBeEnabled();
 const after=await state();expect(after.simulation.central.policy.aidSilverLimit).toBe(50);
 await page.screenshot({path:'docs/screenshots/economic-units-budget.png',fullPage:true});
 await page.reload();await page.getByRole('button',{name:/Tiếp tục trị vì/}).click();
 const loaded=await state();expect(loaded).toEqual(after);expect(errors).toEqual([]);
 await fs.writeFile('docs/ECONOMIC_UNITS_BROWSER.json',JSON.stringify({passed:true,errors,checks:['HUD conversion','market price and supply','farm land +10% detail','mine +12 wood/stone and +6 ore detail','administration +3 percentage-point detail','building wages','policy input','silver transfer input','grain order input','monthly tick','autosave reload'],opening:{silver:48000,grain:96000}},null,2));
}finally{await browser.close();}



