import type { GameState,Character } from '../domain/schema';
import type { Court } from '../domain/court';
import { centralSeatSchema } from '../domain/court';
import { uniquePersonName } from './personNames';

// A separate hash stream keeps political content from changing economic weather draws.
export function courtHash(seed:number,key:string){let n=seed>>>0;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;}
export function countyOfficial(seed:number,unitId:string,year:number,generation=0){const n=courtHash(seed,`${unitId}:${generation}`);return{id:`local:${unitId}:${generation}`,name:uniquePersonName(seed,`local:${unitId}:${generation}`,new Set()),age:30+(n>>>16)%20,appointedYear:year,generation,retirementAge:65+(n>>>24)%6};}
export function initializeCourt(input:GameState):GameState{
 if(input.court?.centralOffices)return input;
 const s=structuredClone(input),tick=s.simulation?.tick??0;
 if(s.court){s.court.pendingExams??=[];const used=new Set(s.characters.map(c=>c.name));s.court.centralOffices=centralSeatSchema.options.map(seat=>{const n=courtHash(s.seed,`central:${seat}`),id=`official:central:${seat}`;if(!s.characters.some(c=>c.id===id)){s.characters.push({id,name:uniquePersonName(s.seed,`central:${seat}`,used),age:30+(n>>>16)%25,health:75+(n>>>24)%26,ability:40+n%51,loyalty:45+(n>>>7)%51,ambition:20+(n>>>12)%71,corruption:5+(n>>>17)%46,prestige:35+(n>>>22)%51,factionId:null,provenance:{kind:'Fictional',note:'Quan trung ương Ninh triều, sinh từ seed khi nâng hồ sơ.'}});used.add(s.characters.at(-1)!.name);s.court!.officers[id]={finance:40+(n>>>3)%51,communication:40+(n>>>11)%51,assets:0,privateMoney:0,unassessed:{},debts:{},status:'free'};}return{seat,holderId:id,since:tick,pending:null,lastAction:null};});return s;}
 const court:Court={profileId:'ning-fictional-v1',provenance:'Fictional',officers:{},estates:[],offices:[],pendingExams:[],countyOfficials:{},constructionPolicies:{},decisions:[],relations:[],factions:[],cases:[],nextId:0};
 const units=s.administrativeUnits.filter(u=>u.levelId==='zhou'||u.levelId==='fu');
 const candidates=Math.max(2,Math.ceil(units.length*.25));
 const used=new Set([s.dynasty.emperorId,...s.militaryUnits.flatMap(a=>a.commanderId?[a.commanderId]:[])]);
 const usedNames=new Set(s.characters.map(c=>c.name));
 const add=(key:string,existing?:Character)=>{
  const n=courtHash(s.seed,key),id=existing?.id??`official:${key}`;
  const c:Character=existing??{id,name:uniquePersonName(s.seed,key,usedNames),age:30+(n>>>16)%25,health:75+(n>>>24)%26,ability:40+n%51,loyalty:45+(n>>>7)%51,ambition:20+(n>>>12)%71,corruption:5+(n>>>17)%46,prestige:35+(n>>>22)%51,factionId:null,provenance:{kind:'Fictional',note:'Quan chức Ninh triều; tên Hán ngữ giả tưởng, không đại diện nhân vật lịch sử.'}};
  if(!existing){s.characters.push(c);usedNames.add(c.name);}
  court.officers[id]={finance:40+(n>>>3)%51,communication:40+(n>>>11)%51,assets:0,privateMoney:0,unassessed:{},debts:{},status:'free'};used.add(id);return c;
 };
 for(const u of units){const existing=s.characters.find(c=>c.id===u.governorId&&!used.has(c.id));const c=add(u.id,existing);u.governorId=c.id;court.offices.push({unitId:u.id,holderId:c.id,since:tick,pending:null,history:[{tick,event:'Nhận chức khi khởi tạo hồ sơ công vụ.'}]});}
 for(let i=0;i<candidates;i++)add(`candidate:${i}`);
 court.centralOffices=centralSeatSchema.options.map(seat=>{const c=add(`central:${seat}`);return{seat,holderId:c.id,since:tick,pending:null,lastAction:null};});
 for(const u of s.administrativeUnits.filter(u=>u.levelId==='xian')){u.governorId=null;court.countyOfficials[u.id]=countyOfficial(s.seed,u.id,s.calendar.year);}
 const ids=Object.keys(court.officers);
 const interests=['finance','welfare','local'] as const;
 const factionNames=['Hội Kinh dụng','Hội Dưỡng dân','Liên minh Hương nghị'];
 for(let i=0;i<3;i++){const members=ids.filter((_,j)=>j%3===i);if(!members.length)continue;const id=`ning-faction:${i}`;court.factions.push({id,name:factionNames[i]!,leaderId:members[0]!,members,interest:interests[i]!,support:50,lastReason:'Mạng quyền lực giả tưởng Ninh triều; chưa có phản ứng công vụ.'});for(const member of members)s.characters.find(c=>c.id===member)!.factionId=id;}
 s.court=court;return s;
}
