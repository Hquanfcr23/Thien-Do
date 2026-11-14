import { z } from 'zod';
const amount=z.number().finite().nonnegative(),ratio=z.number().finite().min(0).max(1);
export const goods=['grain','wood','stone','ore','iron','tools','fiber','cloth','equipment'] as const;
export type Good=typeof goods[number];
export const stockSchema=z.object({grain:amount,wood:amount,stone:amount,ore:amount,iron:amount,tools:amount,fiber:amount,cloth:amount,equipment:amount}).strict();
export type Stock=z.infer<typeof stockSchema>;
export const buildingKinds=['farm','irrigation','granary','mine','workshop','market','road','bridge','canal','port','relay','depot','administration','fort'] as const;
export const buildingKindSchema=z.enum(buildingKinds);
export type BuildingKind=z.infer<typeof buildingKindSchema>;
export const policySchema=z.object({landTax:ratio,tradeTax:ratio,farmShare:ratio,industryShare:ratio,reserveShare:ratio,tradeOpen:z.boolean()}).strict().refine(p=>p.farmShare+p.industryShare+p.reserveShare<=1,'Tổng phân bổ lao động vượt 100%');
export const orderSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('policy'),policy:policySchema}).strict(),
 z.object({kind:z.literal('build'),countyId:z.string(),building:buildingKindSchema}).strict(),
 z.object({kind:z.literal('transfer'),from:z.string(),to:z.string(),good:z.enum(goods),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('route'),routeId:z.string(),blocked:z.boolean()}).strict(),
 z.object({kind:z.literal('relief'),countyId:z.string(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('grant'),countyId:z.string(),amount:amount.positive()}).strict(),
]);
export type Order=z.infer<typeof orderSchema>;
export const countyEconomySchema=z.object({
 households:amount,workingAge:amount,farmers:amount,landowners:amount,artisans:amount,unemployment:ratio,livingStandard:ratio,
 privateMoney:amount,land:amount,soil:ratio,water:ratio,crop:z.enum(['millet','wheat']),sown:amount,cropHealth:ratio,
 deposits:z.object({wood:amount,stone:amount,ore:amount}).strict(),buildings:z.record(z.string(),z.object({level:z.number().int().min(1).max(5),condition:ratio}).strict()),
 projects:z.array(z.object({building:buildingKindSchema,work:amount,required:amount}).strict()),prices:stockSchema,demand:stockSchema,
 lastTaxNominal:amount,lastTaxPaid:amount,shortage:ratio,lastHarvest:amount,lastBirths:amount,lastDeaths:amount,lastMigration:z.number().finite(),lastWorkers:amount,lastConstruction:amount,lastMilitary:amount,
}).strict();
export const routeSchema=z.object({id:z.string(),from:z.string(),to:z.string(),mode:z.enum(['road','river']),km:amount.positive(),capacity:amount.positive(),quality:ratio,blocked:z.boolean(),used:amount,lastCapacity:amount}).strict();
export const shipmentSchema=z.object({id:z.number().int().nonnegative(),from:z.string(),to:z.string(),good:z.enum(goods),amount:amount,path:z.array(z.string()).min(1),leg:z.number().int().nonnegative(),remaining:amount,entered:z.boolean()}).strict();
export const economicReportSchema=z.object({year:z.number().int(),month:z.number().int(),produced:stockSchema,used:stockSchema,destroyed:stockSchema,goodsError:stockSchema,population:amount,births:amount,deaths:amount,migration:amount,harvest:amount,consumed:amount,loss:amount,tax:amount,spending:amount,treasury:amount,grain:amount,shortageCount:amount,moneyError:z.number().finite(),grainError:z.number().finite(),notes:z.array(z.string())}).strict();
export const simulationSchema=z.object({revision:z.literal(1),rng:z.number().int().nonnegative().max(4294967295),tick:z.number().int().nonnegative(),nextId:z.number().int().nonnegative(),policy:policySchema,counties:z.record(z.string(),countyEconomySchema),routes:z.array(routeSchema),shipments:z.array(shipmentSchema),orders:z.array(orderSchema).max(1000),reports:z.array(economicReportSchema).max(240),annual:z.array(economicReportSchema).max(100),weatherMode:z.enum(['normal','drought']),lastMessages:z.array(z.string())}).strict();
export type Simulation=z.infer<typeof simulationSchema>;
export type CountyEconomy=z.infer<typeof countyEconomySchema>;
export type Route=z.infer<typeof routeSchema>;
export type Report=z.infer<typeof economicReportSchema>;
export const emptyStock=():Stock=>({grain:0,wood:0,stone:0,ore:0,iron:0,tools:0,fiber:0,cloth:0,equipment:0});
