import type {Good,Order} from './economy';

// Save/engine quantities remain canonical-v1. Only player-facing units change.
// Fictional calibration inspired by Ming grain prices; not a historical fixed exchange rate.
export const economicUnits={silver:8,grain:16,profile:'ming-inspired-v1'} as const;
export const silverAmount=(n:number)=>n*economicUnits.silver;
export const grainAmount=(n:number)=>n*economicUnits.grain;
export const goodsAmount=(n:number,g:string)=>g==='grain'?grainAmount(n):n;
export const goodsPrice=(n:number,g:Good)=>silverAmount(n)/(g==='grain'?economicUnits.grain:1);
const numeric=(n:number,digits:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:digits});
/** Treasury balances and all silver-denominated amounts display whole taels. */
export const moneyNumber=(n:number)=>numeric(silverAmount(n),0);
export const grainNumber=(n:number)=>numeric(grainAmount(n),1);
export const quantityNumber=(n:number,g:string)=>numeric(goodsAmount(n,g),1);
export const priceNumber=(n:number,g:Good)=>numeric(goodsPrice(n,g),2);
/** Persisted narrative notes use canonical numbers (including older saves). */
export function economicText(text:string):string{
 return text.replace(/(\d+(?:\.\d+)?(?:,\s*(?:chi |xuất |hao )?\d+(?:\.\d+)?)*) (lượng|thạch(?: lương)?)/g,(_match,values:string,unit:string)=>
  values.replace(/\d+(?:\.\d+)?/g,n=>unit==='lượng'?moneyNumber(Number(n)):grainNumber(Number(n)))+' '+(unit==='lượng'?unit:'thạch lương'));
}
/** Convert player-entered physical units once at the command boundary. Ratios are unchanged. */
export function canonicalOrder(order:Order):Order{
 switch(order.kind){
  case 'grant':case 'budget-transfer':return {...order,amount:order.amount/economicUnits.silver};
  case 'relief':case 'reserve-transfer':case 'sell-grain':case 'buy-grain':case 'withdraw-grain':return {...order,amount:order.amount/economicUnits.grain};
  case 'transfer':return {...order,amount:order.amount/(order.good==='grain'?economicUnits.grain:1)};
  case 'central-policy':return {...order,policy:{...order.policy,aidSilverLimit:order.policy.aidSilverLimit/economicUnits.silver,cashFloor:order.policy.cashFloor/economicUnits.silver,aidGrainLimit:order.policy.aidGrainLimit/economicUnits.grain,grainFloor:order.policy.grainFloor/economicUnits.grain}};
  default:return order;
 }
}
