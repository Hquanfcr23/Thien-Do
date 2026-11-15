import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import process from 'node:process';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950},acceptDownloads:true});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(process.env.MAP_TEST_URL||'http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();
 await page.getByRole('button',{name:'Nhận thiên mệnh',exact:true}).click();
 await page.getByRole('button',{name:'Triều đình',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Triều đình trung ương'})).toBeVisible();
 const rosters=page.locator('.court-roster');await expect(rosters).toHaveCount(2);await expect(rosters.nth(0).locator('.court-roster-row')).toHaveCount(8);await expect(rosters.nth(1).locator('.court-roster-row').first()).toBeVisible();
 await rosters.nth(0).locator('.court-roster-row').first().click();await expect(page.getByRole('complementary',{name:/Thay đổi/})).toBeVisible();await page.screenshot({path:'docs/screenshots/court-roster-drawer.png'});
 await page.locator('.court-drawer-row').nth(2).click();await page.getByRole('button',{name:'Xếp bổ nhiệm'}).click();await expect(page.getByRole('complementary',{name:/Thay đổi/})).toHaveCount(0);
 await rosters.nth(1).locator('.court-roster-row').first().click();await expect(page.getByRole('complementary',{name:/Thay đổi/})).toBeVisible();await page.getByRole('button',{name:'Đóng',exact:true}).click();
 await page.screenshot({path:'docs/screenshots/central-court.png'});
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'Tiến 1 lượt',exact:true}).click();
 await page.getByRole('button',{name:'Sự vụ',exact:true}).click();await expect(page.getByRole('heading',{name:'Tấu nghị trung ương'})).toBeVisible();await expect(page.getByRole('heading',{name:'Giám sát và xét xử'})).toBeVisible();await expect(page.locator('.court-local-seat-row')).toHaveCount(0);await expect(page.locator('.court-roster')).toHaveCount(0);const actions=page.locator('.court-seat-card');await expect(actions).toHaveCount(8);await actions.filter({hasText:'Thượng thư Bộ Lại'}).click();await page.getByRole('button',{name:'Xếp tấu trình'}).click();
 await page.getByRole('button',{name:'Thư khố',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất JSON',exact:true}).click();const exported=JSON.parse(await fs.readFile(await(await pending).path(),'utf8'));
 expect(exported.schemaVersion).toBe(9);expect(exported.state.court.centralOffices.find(o=>o.seat==='personnel').lastAction).not.toBeNull();
 expect(exported.state.simulation.reports.at(-1).moneyError).toBeLessThan(1e-5);expect(errors).toEqual([]);
}finally{await browser.close();}
