import { z } from 'zod';

const id=z.string().min(1),score=z.number().finite().min(0).max(100),tick=z.number().int().nonnegative();
export const prioritySchema=z.enum(['forbid','low','normal','high','focus']);
export const constructionPolicySchema=z.record(id,prioritySchema);
export const centralSeatSchema=z.enum(['chief','personnel','revenue','rites','war','justice','works','censor']);
export const centralOfficeSchema=z.object({seat:centralSeatSchema,holderId:id.nullable(),since:tick,pending:z.object({characterId:id.nullable(),effectiveTick:tick}).strict().nullable(),lastAction:tick.nullable(),lastTarget:id.optional(),lastBuilding:id.optional(),lastExam:tick.optional()}).strict();
export const courtOrderSchemas=[
 z.object({kind:z.literal('central-appoint'),seat:centralSeatSchema,characterId:id.nullable()}).strict(),
 z.object({kind:z.literal('central-action'),seat:centralSeatSchema,targetId:id.optional(),amount:z.number().finite().nonnegative().optional(),building:id.optional(),program:z.enum(['ceremony','exam']).optional()}).strict(),
 z.object({kind:z.literal('appoint'),unitId:id,characterId:id.nullable()}).strict(),
 z.object({kind:z.literal('construction-policy'),unitId:id,priorities:constructionPolicySchema.nullable()}).strict(),
 z.object({kind:z.literal('inspect'),prefectureId:id,subjectId:id.optional(),investigatorId:id,mode:z.enum(['audit','investigation'])}).strict(),
 z.object({kind:z.literal('resolve-case'),caseId:id,action:z.enum(['warn','dismiss','trial','close']),sentence:z.enum(['recover','dismiss','imprison','exile','execute']).optional()}).strict(),
 z.object({kind:z.literal('pardon'),characterId:id}).strict(),
 z.object({kind:z.literal('buy-estate'),characterId:id,countyId:id,amount:z.number().finite().positive()}).strict(),
] as const;
export const courtSchema=z.object({
 profileId:z.literal('ning-fictional-v1'),provenance:z.literal('Fictional'),
 officers:z.record(id,z.object({finance:score,communication:score,assets:z.number().finite().nonnegative(),privateMoney:z.number().finite().nonnegative(),unassessed:z.record(id,z.number().finite().nonnegative()),debts:z.record(id,z.number().finite().nonnegative()),status:z.enum(['free','imprisoned','exiled','dead'])}).strict()),
 estates:z.array(z.object({id,characterId:id,countyId:id,value:z.number().finite().positive(),confiscatedBy:id.nullable()}).strict()),
 offices:z.array(z.object({unitId:id,holderId:id.nullable(),since:tick,pending:z.object({characterId:id.nullable(),effectiveTick:tick}).strict().nullable(),history:z.array(z.object({tick,event:z.string()}).strict()).max(100)}).strict()),
 centralOffices:z.array(centralOfficeSchema).optional(),
 pendingExams:z.array(z.object({due:tick,seed:tick}).strict()).optional(),
 countyOfficials:z.record(id,z.object({id,name:id,age:z.number().int().nonnegative(),appointedYear:z.number().int().positive(),generation:tick,retirementAge:z.number().int().positive()}).strict()),
 constructionPolicies:z.record(id,constructionPolicySchema),
 decisions:z.array(z.object({tick,prefectureId:id,targetId:id,building:id,started:z.boolean(),reason:z.string(),reviewTick:tick}).strict()),
 relations:z.array(z.object({from:id,to:id,type:z.enum(['kinship','mentor','colleague','patron','rival','grudge']),trust:score,memories:z.array(z.object({tick,cause:z.string().min(1),delta:z.number().finite(),lasting:z.boolean()}).strict()).max(50)}).strict()),
 factions:z.array(z.object({id,name:id,leaderId:id,members:z.array(id),interest:z.enum(['finance','welfare','local']),support:score,lastReason:z.string()}).strict()),
 cases:z.array(z.object({id,prefectureId:id,subjectId:id,investigatorId:id,mode:z.enum(['audit','investigation']),started:tick,due:tick,cost:z.number().finite().nonnegative(),status:z.enum(['pending','clear','suspected','concluded','closed']),evidence:score,alleged:z.boolean(),falseFinding:z.boolean(),recoverable:z.number().finite().nonnegative(),outcome:z.string(),reviewDue:tick.optional(),reviewerId:id.optional()}).strict()).max(200),
 nextId:tick,
}).strict();
export type Court=z.infer<typeof courtSchema>;
export type Priority=z.infer<typeof prioritySchema>;
