import { courtOrderSchemas } from './court';
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
export const fiscalPolicySchema=z.object({reserveMonths:z.number().finite().min(0).max(12),cashBufferMonths:z.number().finite().min(0).max(12),autoSell:z.boolean(),cashTaxShare:ratio,administrationShare:ratio}).strict();
export const accountsSchema=z.object({tax:amount,sales:amount,grainPurchases:amount,administration:amount,maintenance:amount,freight:amount,construction:amount,transfersIn:amount,transfersOut:amount}).strict();
export const emptyAccounts=()=>({tax:0,sales:0,grainPurchases:0,administration:0,maintenance:0,freight:0,construction:0,transfersIn:0,transfersOut:0});
export const defaultFiscalPolicy=()=>({reserveMonths:1,cashBufferMonths:2,autoSell:true,cashTaxShare:.4,administrationShare:1});
export const centralPolicySchema=z.object({cashRemitRate:ratio,grainRemitRate:ratio,aidSilverLimit:amount,aidGrainLimit:amount,cashFloor:amount,grainFloor:amount}).strict();
export const emptyCentralAccounts=()=>({silverIn:0,silverOut:0,grainIn:0,grainOut:0,grainLoss:0,storageCost:0,remitDue:0,remitUnpaid:0});
export const defaultCentral=()=>({policy:{cashRemitRate:.1,grainRemitRate:.1,aidSilverLimit:100,aidGrainLimit:0,cashFloor:1000,grainFloor:1000},accounts:emptyCentralAccounts(),grainYears:{} as Record<string,number>});
export const centralSchema=z.object({policy:centralPolicySchema,accounts:z.object({silverIn:amount,silverOut:amount,grainIn:amount,grainOut:amount,grainLoss:amount,storageCost:amount,remitDue:amount,remitUnpaid:amount}).strict(),grainYears:z.record(z.string(),z.number().int().positive())}).strict();
export const orderSchema=z.discriminatedUnion('kind',[
 ...courtOrderSchemas,
 z.object({kind:z.literal('prefecture-policy'),prefectureId:z.string(),policy:policySchema.nullable()}).strict(),
 z.object({kind:z.literal('central-policy'),policy:centralPolicySchema}).strict(),
 z.object({kind:z.literal('fiscal'),prefectureId:z.string(),policy:fiscalPolicySchema}).strict(),
 z.object({kind:z.literal('withdraw-grain'),prefectureId:z.string(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('sell-grain'),prefectureId:z.string(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('buy-grain'),prefectureId:z.string(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('budget-transfer'),from:z.string(),to:z.string(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('reserve-transfer'),from:z.string(),to:z.string(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('policy'),policy:policySchema,zhouId:z.string().optional()}).strict(),
 z.object({kind:z.literal('build'),countyId:z.string(),building:buildingKindSchema,routeId:z.string().optional(),legacy:z.boolean().optional()}).strict(),
 z.object({kind:z.literal('transfer'),from:z.string(),to:z.string(),good:z.enum(goods),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('route'),routeId:z.string(),blocked:z.boolean()}).strict(),
 z.object({kind:z.literal('relief'),countyId:z.string(),prefectureId:z.string().optional(),amount:amount.positive()}).strict(),
 z.object({kind:z.literal('grant'),countyId:z.string(),amount:amount.positive()}).strict(),
]);
export type Order=z.infer<typeof orderSchema>;
export const projectSchema=z.object({building:buildingKindSchema,work:amount,required:amount.positive(),costScale:amount.positive().optional(),routeId:z.string().optional(),materials:stockSchema,legacyFunded:z.boolean(),pausedReason:z.string().nullable()}).strict();
export const installedBuildingSchema=z.object({level:z.number().int().min(1).max(5),condition:ratio,legacy:z.boolean().optional()}).strict();
export const installedBuildingsSchema=z.record(z.string(),installedBuildingSchema);
export const countyEconomySchema=z.object({
 households:amount,workingAge:amount,farmers:amount,landowners:amount,artisans:amount,unemployment:ratio,livingStandard:ratio,
 privateMoney:amount,land:amount,soil:ratio,water:ratio,crop:z.enum(['millet','wheat']),sown:amount,cropHealth:ratio,
 deposits:z.object({wood:amount,stone:amount,ore:amount}).strict(),buildings:installedBuildingsSchema,
 projects:z.array(projectSchema),
 lastTaxNominal:amount,lastTaxPaid:amount,shortage:ratio,lastHarvest:amount,lastBirths:amount,lastDeaths:amount,lastMigration:z.number().finite(),lastWorkers:amount,lastConstruction:amount,lastMilitary:amount,
}).strict();
export const routeSchema=z.object({id:z.string(),from:z.string(),to:z.string(),mode:z.enum(['road','river']),km:amount.positive(),capacity:amount.positive(),quality:ratio,blocked:z.boolean(),used:amount,lastCapacity:amount,upgrade:z.object({level:z.number().int().min(1).max(3),condition:ratio,ownerId:z.string(),baseScale:amount.positive()}).strict().optional()}).strict();
export const prefectureEconomySchema=z.object({fiscalPolicy:fiscalPolicySchema,accounts:accountsSchema,serviceLevel:ratio,seatCountyId:z.string(),treasury:amount,grainReserve:amount,market:z.object({inventory:stockSchema,publicListings:stockSchema,prices:stockSchema,demand:stockSchema,merchantMoney:amount}).strict(),buildings:installedBuildingsSchema,projects:z.array(projectSchema)}).strict();
export const shipmentSchema=z.object({id:z.number().int().nonnegative(),from:z.string(),to:z.string(),good:z.enum(goods),amount:amount,purpose:z.enum(['private','tax','market','construction','reserve','relief']),prefectureId:z.string().nullable(),projectTargetId:z.string().nullable(),building:buildingKindSchema.nullable(),path:z.array(z.string()).min(1),leg:z.number().int().nonnegative(),remaining:amount,entered:z.boolean()}).strict();
export const economicReportSchema=z.object({year:z.number().int(),month:z.number().int(),produced:stockSchema,used:stockSchema,destroyed:stockSchema,goodsError:stockSchema,population:amount,births:amount,deaths:amount,migration:amount,harvest:amount,consumed:amount,loss:amount,tax:amount,spending:amount,treasury:amount,grain:amount,shortageCount:amount,moneyError:z.number().finite(),grainError:z.number().finite(),notes:z.array(z.string())}).strict();
export const simulationSchema=z.object({buildingRules:z.literal('core-v1').optional(),central:centralSchema.optional(),revision:z.literal(3),rng:z.number().int().nonnegative().max(4294967295),tick:z.number().int().nonnegative(),nextId:z.number().int().nonnegative(),policy:policySchema,zhouPolicies:z.record(z.string(),policySchema),prefecturePolicies:z.record(z.string(),policySchema).default({}),prefectures:z.record(z.string(),prefectureEconomySchema),counties:z.record(z.string(),countyEconomySchema),routes:z.array(routeSchema),shipments:z.array(shipmentSchema),orders:z.array(orderSchema).max(1000),reports:z.array(economicReportSchema).max(240),annual:z.array(economicReportSchema).max(100),weatherMode:z.enum(['normal','drought']),lastMessages:z.array(z.string())}).strict();
export type Simulation=z.infer<typeof simulationSchema>;
export type CountyEconomy=z.infer<typeof countyEconomySchema>;
export type Route=z.infer<typeof routeSchema>;
export type Report=z.infer<typeof economicReportSchema>;
export const emptyStock=():Stock=>({grain:0,wood:0,stone:0,ore:0,iron:0,tools:0,fiber:0,cloth:0,equipment:0});

export type PrefectureEconomy=z.infer<typeof prefectureEconomySchema>;
