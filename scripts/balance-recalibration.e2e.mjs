import {chromium,expect} from '@playwright/test';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5178/');
 await page.getByRole('button',{name:/Khởi lập triều đại/}).click();
 await page.getByRole('button',{name:/Nhận thiên mệnh/}).click();
 await page.getByRole('button',{name:'Kinh tế',exact:true}).click();
 await page.getByRole('navigation',{name:'Mục kinh tế'}).getByRole('button',{name:'Thuế',exact:true}).click();
 await expect(page.getByText(/Thuế đất trên 20% khó thu đủ/)).toBeVisible();
 await page.getByRole('spinbutton',{name:'Thuế đất',exact:true}).fill('60');
 await page.getByRole('button',{name:'Xếp chính sách',exact:true}).click();
 await page.getByRole('button',{name:'Tiến 1 lượt',exact:true}).click();
 await page.getByRole('button',{name:'Tiến 1 lượt',exact:true}).click();
 const tax=await page.evaluate(async()=>{
  const {useGameStore}=await import('/src/state/gameStore.ts');
  return useGameStore.getState().game.simulation.policy.landTax;
 });
 expect(tax).toBe(.6);
 await page.screenshot({path:'docs/screenshots/balance-recalibration-tax.png',fullPage:true});
 expect(errors).toEqual([]);
 console.log(JSON.stringify({passed:true,tax,browserErrors:errors}));
}finally{await browser.close();}
