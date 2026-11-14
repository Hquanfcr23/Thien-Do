import { crops,recipes } from '../data/economicConfig';
import { emptyStock,type Good } from '../domain/economy';
import { bound,effect,productionEffect,stock,spendPrivate,countyDemand,type MonthContext } from './economyContext';
export function produce(ctx:MonthContext){
 for(const [id,c] of Object.entries(ctx.s.simulation.counties)){
  const u=ctx.units.get(id)!,labour=ctx.labour.get(id)!,m=ctx.s.calendar.month,crop=crops[c.crop],w=ctx.weather.get(id)!;
  const land=c.land*(1+productionEffect(ctx,id,'farm',[0,.1,.18,.24],.1)),coverage=bound(labour.farm/Math.max(1,land*1.5));
  c.lastHarvest=0;ctx.taxable??=new Map();const taxable=emptyStock();ctx.taxable.set(id,taxable);
  if(m===crop.sow){const seed=Math.min(stock(u,'grain'),land*.04),funding=bound(c.privateMoney/Math.max(1,land*.025));c.sown=Math.min(land,seed/.04)*coverage*funding;u.resources.grain=stock(u,'grain')-c.sown*.04;ctx.report.consumed+=c.sown*.04;spendPrivate(ctx,u,c,c.sown*.025);c.cropHealth=1;}
  if(crop.months.includes(m as never)&&c.sown>0){const water=bound(w.rain*c.water+productionEffect(ctx,id,'irrigation',[0,.1,.18,.24],.15),.08,1);c.cropHealth*=Math.pow(bound(.45+.55*water)*bound(.55+.45*coverage)*(1-w.disaster*.35),1/crop.months.length);}
  if(m===crop.harvest&&c.sown>0){const tools=Math.min(1,stock(u,'tools')/Math.max(1,c.sown*.01));const harvest=c.sown*.95*crop.yield*c.soil*c.cropHealth*(.8+.2*tools);const fiber=c.sown*.05*c.soil*c.cropHealth*2;u.resources.fiber=stock(u,'fiber')+fiber;ctx.report.produced.fiber+=fiber;u.resources.grain=stock(u,'grain')+harvest;c.lastHarvest=harvest;taxable.grain=harvest;ctx.report.harvest+=harvest;c.sown=0;}
  let workers=labour.industry,employed=0;
  for(const g of ['wood','stone','ore'] as const){const allocated=Math.min(workers,labour.industry*.15);workers-=allocated;const cap=(12+12*productionEffect(ctx,id,'mine',[0,1,2,3],1))*(g==='ore'?.5:1);const amount=Math.min(c.deposits[g],allocated*.12,cap,c.privateMoney/.08);employed+=amount/.12;c.deposits[g]-=amount;u.resources[g]=stock(u,g)+amount;ctx.report.produced[g]+=amount;taxable[g]+=amount;spendPrivate(ctx,u,c,amount*.08);}
  for(const recipe of recipes){const capacity=Math.min(workers/recipe.workers,1+productionEffect(ctx,id,'workshop',[0,.5,1,1.5],1));workers=Math.max(0,workers-capacity*recipe.workers);let batches=Math.min(capacity*recipe.rate,c.privateMoney/.2);for(const [g,n] of Object.entries(recipe.inputs))batches=Math.min(batches,stock(u,g as Good)/n);employed+=batches/recipe.rate*recipe.workers;for(const [g,n] of Object.entries(recipe.inputs)){u.resources[g]=stock(u,g as Good)-batches*n;if(g==='grain')ctx.report.consumed+=batches*n;else ctx.report.used[g as Good]+=batches*n;}u.resources[recipe.output]=stock(u,recipe.output)+batches;ctx.report.produced[recipe.output]+=batches;taxable[recipe.output]+=batches;spendPrivate(ctx,u,c,batches*.2);}
  const farmWork=Math.min(labour.farm,land*(crop.months.includes(m as never)?1.5:.2));c.lastWorkers=Math.min(labour.total,farmWork+employed+labour.commerce);c.unemployment=bound(1-(c.lastWorkers+labour.construction+labour.military)/Math.max(1,labour.total));
  const climate=ctx.s.calendar.month>=10||ctx.s.calendar.month<=2?1.15:1;
  const demand=u.population*.025*climate+labour.military*.015;const needs=countyDemand(ctx,id);void needs;
  const food=Math.min(stock(u,'grain'),demand);u.resources.grain=stock(u,'grain')-food;ctx.report.consumed+=food;c.shortage=demand?1-food/demand:0;

  const cloth=Math.min(stock(u,'cloth'),needs.cloth),tools=Math.min(stock(u,'tools'),land*.0003);ctx.report.used.cloth+=cloth;ctx.report.used.tools+=tools;u.resources.cloth=stock(u,'cloth')-cloth;u.resources.tools=stock(u,'tools')-tools;
  const capacity=u.population*.3*(1+effect(c,'granary'));
  const excess=Math.max(0,stock(u,'grain')-capacity),loss=stock(u,'grain')*(.012/(1+effect(c,'granary')))+excess*.1;
  u.resources.grain=stock(u,'grain')-loss;ctx.report.loss+=loss;
 }
}
