/* global document */
import { chromium,expect } from '@playwright/test';
import fs from 'node:fs';
import polylabel from 'polylabel';
import {geoConicConformal} from 'd3-geo';
const projection=geoConicConformal().parallels([25,47]).rotate([-105,0]).center([0,35]).translate([700,425]).scale(7200).precision(.2);
const source=JSON.parse(fs.readFileSync('.audit/gis/counties.json')).features;
const membership=JSON.parse(fs.readFileSync('docs/GIS_COUNTY_MEMBERSHIP.json'));
const ids=['17275852B20312470606875','17275852B62782445600014','17275852B72607841305823','17275852B92852559512567','17275852B65553722631482','17275852B37493799025038','17275852B32909465051494'];
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await page.goto('http://127.0.0.1:5173/');await page.getByRole('button',{name:'Khởi lập triều đại',exact:true}).click();await page.getByRole('button',{name:'Nhận thiên mệnh'}).click();await page.getByRole('button',{name:'Đóng bảng quản lý'}).click();await page.getByRole('combobox',{name:'Cấp bản đồ'}).selectOption('xian');
 for(const id of ids){const f=source.find(f=>f.properties.shapeID===id),m=membership.find(m=>m.shapeID===id);const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;const p=polylabel(polys[0].map(r=>r.map(c=>projection(c))),.005);
  const hit=await page.getByTestId('map-camera').evaluate((el,point)=>{const s=el.ownerSVGElement.createSVGPoint();s.x=point[0];s.y=point[1];const q=s.matrixTransform(el.getScreenCTM());const node=document.elementFromPoint(q.x,q.y);return {x:q.x,y:q.y,id:node?.getAttribute('data-unit-id')};},p);
  expect(hit.id,`${f.properties.shapeName} source point`).toBe(m.unitId);await page.mouse.click(hit.x,hit.y);await expect(page.getByTestId(`territory-${m.unitId}`)).toHaveAttribute('aria-pressed','true');const close=page.getByRole('button',{name:'Đóng bảng quản lý'});if(await close.count())await close.click();
 }
 await page.screenshot({path:'docs/screenshots/gaps-repaired.png',fullPage:true});
}finally{await browser.close();}
