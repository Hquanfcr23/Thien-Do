import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import process from 'node:process';

const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1600,height:950},reducedMotion:'no-preference'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>errors.push(`request failed: ${r.url()} (${r.failure()?.errorText??'unknown'})`));
page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`);});
const base=process.env.UI_AUDIT_URL||'http://127.0.0.1:5173/';
const panels=['Đế quốc','Hành chính','Xây dựng','Triều đình','Sử quan','Kinh tế'];
async function checkViewport(width,height){
 await page.setViewportSize({width,height});await page.waitForTimeout(80);
 const layout=await page.evaluate(()=>({width:globalThis.innerWidth,scrollWidth:globalThis.document.documentElement.scrollWidth,scrollHeight:globalThis.document.documentElement.scrollHeight,main:globalThis.document.querySelector('main')?.getBoundingClientRect().toJSON(),panel:globalThis.document.querySelector('.management-panel')?.getBoundingClientRect().toJSON()}));
 expect(layout.scrollWidth,`horizontal overflow at ${width}x${height}`).toBeLessThanOrEqual(width);
 expect(layout.main?.width).toBeLessThanOrEqual(width+1);
 if(layout.panel){expect(layout.panel.width).toBeGreaterThan(250);expect(layout.panel.right).toBeLessThanOrEqual(width+1);expect(layout.panel.left).toBeGreaterThanOrEqual(0);}
}

try{
 await page.goto(base);await expect(page.getByRole('heading',{name:'ĐẾ NGHIỆP'})).toBeVisible();
 await page.screenshot({path:'docs/screenshots/ui-polish-menu.png',fullPage:true});
 await page.keyboard.press('Tab');const focus=await page.evaluate(()=>globalThis.getComputedStyle(globalThis.document.activeElement).outlineStyle);expect(focus).not.toBe('none');
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await page.getByRole('button',{name:'Nhận thiên mệnh',exact:true}).click();
 await expect(page.getByRole('region',{name:'Màn hình trị vì'})).toBeVisible();await checkViewport(1600,950);
 const initialDate=await page.locator('.imperial-date strong').innerText();
 for(const name of panels){
  await page.getByRole('navigation',{name:'Các bảng quản lý'}).getByRole('button',{name,exact:true}).click();
  await expect(page.getByRole('complementary',{name:`Bảng ${name}`})).toBeVisible();await checkViewport(1600,950);
  if(name==='Kinh tế'){
   const scope=page.getByRole('combobox',{name:'Phạm vi kinh tế'});await scope.focus();const focusStyle=await scope.evaluate(el=>({outline:globalThis.getComputedStyle(el).outlineOffset,shadow:globalThis.getComputedStyle(el).boxShadow}));expect(focusStyle.outline).toBe('-2px');expect(focusStyle.shadow).toContain('inset');await scope.selectOption('zhou-tay-linh-fu-1');await expect(scope).not.toBeFocused();
   const tabs=page.getByRole('navigation',{name:'Mục kinh tế'});
   for(const tab of ['Tổng quan','Dân số','Sản xuất','Thị trường','Vận tải','Xây dựng','Thuế','Ngân sách & kho','Báo cáo']){
    await tabs.getByRole('button',{name:tab,exact:true}).click();await expect(tabs.getByRole('button',{name:tab,exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('alert')).toHaveCount(0);await checkViewport(1600,950);
    if(tab==='Thị trường')await page.screenshot({path:'docs/screenshots/ui-polish-market.png'});
   }
  }
  if(name==='Hành chính')await page.screenshot({path:'docs/screenshots/ui-polish-administration.png'});
  if(name==='Triều đình')await page.screenshot({path:'docs/screenshots/ui-polish-court.png'});
 }
 await page.getByRole('button',{name:'Thiết lập'}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('checkbox',{name:/Tên đơn vị trên bản đồ/}).uncheck();await page.getByRole('checkbox',{name:/Chữ quản lý lớn hơn/}).check();await page.screenshot({path:'docs/screenshots/ui-polish-settings.png'});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Thư khố',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('combobox',{name:'Ô lưu'})).toBeVisible();await page.keyboard.press('Escape');
 expect(await page.locator('.imperial-date strong').innerText()).toBe(initialDate);
 await page.screenshot({path:'docs/screenshots/ui-polish-mobile.png',fullPage:true});await checkViewport(390,844);
 await page.emulateMedia({reducedMotion:'reduce'});const duration=await page.locator('.command-rail button').first().evaluate(el=>globalThis.getComputedStyle(el).transitionDuration);expect(duration.split(',').every(x=>parseFloat(x)<=.001)).toBe(true);
 expect(errors.filter(e=>!e.includes('Failed to load resource: the server responded with a status of 404 (Not Found)'))).toEqual([]);
 await fs.writeFile('docs/UI_POLISH_QA.md',`# UI audit\n\n- Desktop 1600×950 and narrow viewport 390×844: passed layout bounds and horizontal-overflow checks.\n- Main menu, all six management panels, all nine economy tabs, settings, archive and modal Escape: passed.\n- Visible keyboard focus, reduced-motion preference, no page errors/console errors: passed.\n- Calendar remained ${initialDate}; this audit did not advance a turn.\n- Screenshots: ui-polish-menu, ui-polish-administration, ui-polish-market, ui-polish-court, ui-polish-settings, ui-polish-mobile.\n`);
}finally{await browser.close();}
