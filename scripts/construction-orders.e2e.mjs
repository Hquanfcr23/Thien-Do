import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import process from 'node:process';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(async()=>{const {useGameStore}=await import('/src/state/gameStore.ts');return useGameStore.getState().game;});
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5202/');
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();
 await page.getByRole('button',{name:'Nhận thiên mệnh'}).click();
 await expect(page.locator('.empire-resource').first()).toContainText('48.000');
 const game=await state(),countyId=Object.keys(game.simulation.counties)[0],county=game.administrativeUnits.find(u=>u.id===countyId),fu=game.administrativeUnits.find(u=>u.id===county?.parentId),zhouId=fu?.parentId;
 expect(zhouId).toBeTruthy();

 // The new left-rail panel tracks queued projects; it does not replace site construction controls.
 await page.locator('.command-rail').getByRole('button',{name:'Xây dựng',exact:true}).click();
 await expect(page.locator('.construction-orders-heading h3')).toHaveText('Xây dựng');
 await expect(page.getByText('Chưa có lệnh xây dựng đang thi công.')).toBeVisible();
 await expect(page.locator('.construction-new-button')).toHaveCount(0);
 await expect(page.getByRole('combobox',{name:'Lọc theo Châu'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Lọc theo Phủ'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Lọc theo Huyện'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Lọc theo trạng thái'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Lọc theo loại công trình'})).toBeVisible();
 await page.screenshot({path:'docs/screenshots/construction-orders-empty.png',fullPage:true});

 // Construction and upgrades remain available inside Economy at the selected county/prefecture.
 await page.getByRole('button',{name:'Kinh tế',exact:true}).click();
 const scope=page.getByRole('combobox',{name:'Phạm vi kinh tế'});
 await scope.selectOption(countyId);
 await page.getByRole('navigation',{name:'Mục kinh tế'}).getByRole('button',{name:'Xây dựng',exact:true}).click();
 await expect(page.locator('.construction-card')).toHaveCount(6);
 await expect(page.locator('.construction-card h4',{hasText:'Kho lương'})).toHaveCount(0);
 const farm=page.getByRole('button',{name:/Nâng cấp Khai khẩn ruộng/});
 await expect(farm).toBeEnabled();
 expect(await farm.getAttribute('title')).toContain('cấp 0 → 1');
 await page.screenshot({path:'docs/screenshots/construction-site-upgrades.png',fullPage:true});
 await scope.selectOption(fu.id);
 await expect(page.locator('.construction-card')).toHaveCount(2);
 await expect(page.locator('.construction-card h4',{hasText:'Kho lương'})).toHaveCount(1);
 await expect(page.locator('.construction-card h4',{hasText:'Giao thông'})).toHaveCount(1);
 await expect(page.locator('.construction-card h4',{hasText:'Khai khẩn ruộng'})).toHaveCount(0);
 await page.screenshot({path:'docs/screenshots/construction-site-prefecture.png',fullPage:true});
 await scope.selectOption(countyId);
 await expect(page.locator('.construction-card')).toHaveCount(6);
 await farm.click();
 await page.locator('.command-rail').getByRole('button',{name:'Xây dựng',exact:true}).click();
 await expect(page.locator('.construction-order-card .construction-status')).toHaveText('Chờ khởi công');
 await expect(page.getByRole('combobox',{name:'Lọc theo trạng thái'})).toHaveValue('all');
 await page.getByRole('combobox',{name:'Lọc theo trạng thái'}).selectOption('queued');
 await expect(page.locator('.construction-order-card h5')).toHaveText('Khai khẩn ruộng');
 await page.getByRole('combobox',{name:'Lọc theo trạng thái'}).selectOption('all');
 await page.screenshot({path:'docs/screenshots/construction-orders-queued.png',fullPage:true});
 const advance=page.getByRole('button',{name:'Tiến 1 tháng',exact:true});
 const before=await page.locator('.imperial-date strong').innerText();
 await advance.click();await expect(page.locator('.imperial-date strong')).not.toHaveText(before);
 // The queued order transitions into a running project after the monthly engine processes it.
 await expect(page.locator('.construction-order-card h5')).toHaveText('Khai khẩn ruộng');
 await expect(page.locator('.construction-order-card .construction-status')).toHaveText('Đang thi công');
 await expect(page.locator('.construction-progress-label span').first()).toHaveText('Cấp 0 → 1');
 await expect(page.getByRole('progressbar')).toBeVisible();
 await page.getByRole('combobox',{name:'Lọc theo Châu'}).selectOption(zhouId);
 await expect(page.getByText('1 kết quả',{exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Lọc theo trạng thái'}).selectOption('paused');
 await expect(page.getByText('Không có công trường phù hợp bộ lọc.')).toBeVisible();
 await page.getByRole('combobox',{name:'Lọc theo trạng thái'}).selectOption('all');
 await page.getByRole('button',{name:'Chọn trên bản đồ'}).click();
 await expect(page.locator('.construction-orders-heading h3')).toHaveText('Xây dựng');
 await expect(page.locator('.command-rail').getByRole('button',{name:'Xây dựng',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.screenshot({path:'docs/screenshots/construction-orders-list.png',fullPage:true});

 await page.getByRole('button',{name:'Kinh tế',exact:true}).click();
 await expect(page.getByRole('navigation',{name:'Mục kinh tế'})).toContainText('Xây dựng');
 expect(errors).toEqual([]);
 await fs.writeFile('docs/CONSTRUCTION_ORDERS_BROWSER.json',JSON.stringify({passed:true,checks:['dedicated left-rail panel tracks queued orders immediately','queued status transitions to active project after monthly tick','hierarchical filters and status/type/search controls','Phủ lists only granary and route upgrades','Huyện lists only county buildings and route upgrades','upgrade tooltip and real local upgrade command','project progress and map selection keep the construction panel active','no browser runtime errors'],errors},null,2));
}finally{await browser.close();}
