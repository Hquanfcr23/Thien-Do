import { chromium,expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.MAP_TEST_URL||'http://127.0.0.1:5173/';
async function turn(){const b=page.getByRole('button',{name:'Tiến 1 lượt',exact:true});await expect(b).toBeEnabled();await b.click();await expect(b).toBeEnabled();}
async function month(){await turn();await turn();}
async function archive(){await page.getByRole('button',{name:'Thư khố',exact:true}).click();}
async function exported(){await archive();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất JSON',exact:true}).click();const download=await pending;const value=JSON.parse(await fs.readFile(await download.path(),'utf8'));await page.getByRole('button',{name:'Đóng cửa sổ'}).click();return value;}
async function imported(value){await archive();await page.locator('input[type=file]').setInputFiles({name:'phase4-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});await expect(page.getByRole('dialog')).toHaveCount(0);}
try{
 await page.goto(url);await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await page.getByRole('button',{name:'Nhận thiên mệnh',exact:true}).click();
 const initial=await exported();expect(initial.schemaVersion).toBe(9);
 const court=initial.state.court,fu=initial.state.administrativeUnits.find(u=>u.levelId==='fu'),zhou=fu.parentId;
 const candidate=Object.keys(court.officers).find(id=>!court.offices.some(o=>o.holderId===id));
 await page.getByRole('button',{name:'Triều đình',exact:true}).click();await page.getByRole('combobox',{name:'Chức vụ',exact:true}).selectOption(fu.id);await page.getByRole('combobox',{name:'Ứng viên',exact:true}).selectOption(candidate);await page.getByRole('button',{name:'Xếp bổ nhiệm / điều chuyển',exact:true}).click();
 await month();let saved=await exported();expect(saved.state.court.offices.find(o=>o.unitId===fu.id).pending.characterId).toBe(candidate);
 await month();saved=await exported();expect(saved.state.court.offices.find(o=>o.unitId===fu.id).holderId).toBe(candidate);
 await page.getByRole('button',{name:'Kinh tế',exact:true}).click();await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(fu.id);await page.getByRole('button',{name:'Thuế',exact:true}).click();await page.getByRole('spinbutton',{name:'Thuế đất',exact:true}).fill('23');await page.getByRole('button',{name:'Xếp chính sách',exact:true}).click();await month();saved=await exported();expect(saved.state.simulation.prefecturePolicies[fu.id].landTax).toBe(.23);
 await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(zhou);await page.getByRole('spinbutton',{name:'Thuế đất',exact:true}).fill('17');await page.getByRole('button',{name:'Xếp chính sách',exact:true}).click();await month();await expect(page.getByText('Châu: Tùy chỉnh — các Phủ có giá trị hiệu lực khác nhau.',{exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(fu.id);await page.getByRole('button',{name:'Kế thừa chính sách Châu',exact:true}).click();await month();saved=await exported();expect(saved.state.simulation.prefecturePolicies[fu.id]).toBeUndefined();
 await page.getByRole('combobox',{name:'Phạm vi kinh tế'}).selectOption(fu.id);await page.getByRole('navigation',{name:'Mục kinh tế'}).getByRole('button',{name:'Xây dựng',exact:true}).click();
 await page.getByRole('combobox',{name:'Ưu tiên Thủy lợi',exact:true}).selectOption('focus');await page.getByRole('button',{name:'Xếp ưu tiên xây dựng',exact:true}).click();await month();saved=await exported();expect(saved.state.court.constructionPolicies[fu.id].irrigation).toBe('focus');expect(saved.state.court.decisions.some(d=>d.prefectureId===fu.id&&d.building==='irrigation'&&d.reason.length)).toBe(true);expect(await page.getByRole('button',{name:/^Nâng cấp|^Xếp lệnh xây$/}).count()).toBe(0);
 // Explicit funded test fixture for the expensive supervision workflow, separate from normal balance.
 const funded=globalThis.structuredClone(saved);funded.state.simulation.prefectures[fu.id].treasury+=200000;
 await imported(funded);await page.getByRole('button',{name:'Triều đình',exact:true}).click();await page.getByRole('combobox',{name:'Phủ giám sát',exact:true}).selectOption(fu.id);
 const investigator=Object.keys(funded.state.court.officers).find(id=>id!==candidate);
 await page.getByRole('combobox',{name:'Điều tra viên',exact:true}).selectOption(investigator);await page.getByRole('button',{name:'Xếp giám sát',exact:true}).click();await month();saved=await exported();expect(saved.state.court.cases.at(-1).cost).toBe(2.5);expect(saved.state.court.cases.at(-1).status).not.toBe('pending');
 const sentencing=globalThis.structuredClone(saved),person=sentencing.state.court.officers[candidate];person.assets+=1000;person.unassessed[fu.id]=(person.unassessed[fu.id]??0)+1000;
 for(const c of sentencing.state.court.cases)c.status='closed';
 sentencing.state.court.cases.push({id:'fixture-verdict',prefectureId:fu.id,subjectId:candidate,investigatorId:investigator,mode:'investigation',started:0,due:0,cost:0,status:'concluded',evidence:85,alleged:true,falseFinding:false,recoverable:1000,outcome:'Hồ sơ kiểm thử thi hành án'});
 await imported(sentencing);await page.getByRole('button',{name:'Triều đình',exact:true}).click();await page.getByRole('combobox',{name:'Hình phạt fixture-verdict',exact:true}).selectOption('exile');await page.getByRole('button',{name:'Xếp xét xử',exact:true}).click();await month();saved=await exported();expect(saved.state.court.officers[candidate].status).toBe('exiled');expect(saved.state.court.cases.find(c=>c.id==='fixture-verdict').status).toBe('closed');
 await fs.mkdir('docs/screenshots',{recursive:true});await page.screenshot({path:'docs/screenshots/phase4-court.png',fullPage:true});
 await archive();await page.getByRole('combobox',{name:'Ô lưu'}).selectOption('manual-2');await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu hồ sơ.');await page.getByRole('button',{name:'Đóng cửa sổ'}).click();
 await page.reload();await page.getByRole('button',{name:/Tiếp tục trị vì/}).click();const reloaded=await exported();expect(reloaded.state.court).toEqual(saved.state.court);
 const legacy=JSON.parse(await fs.readFile('src/tests/fixtures/phase3-v6.json','utf8'));await imported(legacy);const migrated=await exported();expect(migrated.schemaVersion).toBe(9);expect(migrated.state.court.offices.length).toBeGreaterThan(0);
 expect(errors).toEqual([]);await fs.writeFile('docs/PHASE_4_UI_QA.json',JSON.stringify({passed:true,flows:['create','appointment-delay','prefecture-override','zhou-mixed','inherit','construction-focus-and-reason','audit-cost','sentence-exile','save-reload','export-import','v6-migration'],browserErrors:errors},null,2));
}finally{await browser.close();}

