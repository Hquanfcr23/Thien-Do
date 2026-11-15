import {chromium,expect} from '@playwright/test';
import process from 'node:process';
import console from 'node:console';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const state=()=>page.evaluate(async()=>{
 const {useGameStore}=await import('/src/state/gameStore.ts');
 const game=useGameStore.getState().game;
 return game&&{counties:game.administrativeUnits.filter(u=>u.levelId==='xian').map(u=>({id:u.id,parentId:u.parentId,population:u.population})),units:game.administrativeUnits.map(u=>({id:u.id,parentId:u.parentId,levelId:u.levelId})),turn:game.decisionTurn};
});
const shown=value=>value.toLocaleString('vi-VN');
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5177/');
 await page.getByRole('button',{name:'Khởi lập triều đại'}).click();
 await page.getByRole('button',{name:'Nhận thiên mệnh'}).click();
 await expect(page.locator('.population-resource')).toBeVisible();
 const initial=await state();expect(initial.counties).toHaveLength(24);
 const total=initial.counties.reduce((n,u)=>n+u.population,0);expect(total).toBe(1680000);
 await expect(page.locator('.population-resource strong')).toContainText(shown(total));
 await page.getByRole('button',{name:'Đế quốc',exact:true}).click();
 await expect(page.locator('.imperial-stats').getByText(shown(total))).toBeVisible();
 await page.getByRole('button',{name:'Hành chính',exact:true}).click();
 for(const level of ['zhou','fu','xian']){
  const button=page.locator('.direct-children button').first();await button.click();
  const selected=await page.evaluate(async()=>{const {useGameStore}=await import('/src/state/gameStore.ts');return useGameStore.getState().game.mapView.selectedId});
  const ids=new Set([selected]);let size=0;
  while(ids.size!==size){size=ids.size;for(const u of initial.units)if(u.parentId&&ids.has(u.parentId))ids.add(u.id);}
  const expected=initial.counties.filter(u=>ids.has(u.id)).reduce((n,u)=>n+u.population,0);
  expect(initial.units.find(u=>u.id===selected)?.levelId).toBe(level);
  await expect(page.locator('.territory-summary strong').first()).toHaveText(shown(expected));
 }
 await page.getByRole('button',{name:'Kinh tế',exact:true}).click();
 const county=initial.counties[0];
 for(const [id,expected] of [['capital',total],['zhou-tay-linh',400000],[county.parentId,290000],[county.id,county.population]]){
  await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(id);
  await expect(page.locator('.economy-book').getByText(shown(expected),{exact:true}).first()).toBeVisible();
 }
 await page.getByRole('button',{name:'Tiến 1 lượt'}).click();
 await page.getByRole('button',{name:'Tiến 1 lượt'}).click();
 const updated=await state(),updatedTotal=updated.counties.reduce((n,u)=>n+u.population,0);
 await expect(page.locator('.population-resource strong')).toContainText(shown(updatedTotal));
 await page.screenshot({path:'docs/screenshots/population-scale-ui.png',fullPage:true});
 expect(errors).toEqual([]);
 console.log(JSON.stringify({passed:true,initialPopulation:total,afterOneMonth:updatedTotal,checked:['HUD','Đế quốc','Hành chính Châu/Phủ/Huyện','Kinh tế scope','monthly update'],errors}));
}finally{await browser.close();}
