import { z } from 'zod';
export const mapLevelSchema=z.enum(['zhou','fu','jun','xian']);
export const boundsSchema=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),w:z.number().positive().max(1),h:z.number().positive().max(1)}).strict().refine(b=>b.x+b.w<=1.000001&&b.y+b.h<=1.000001);
export const mapViewSchema=z.object({level:mapLevelSchema,selectedId:z.string().nullable(),zoom:z.number().min(.02).max(4),x:z.number().finite().min(-50000).max(50000),y:z.number().finite().min(-50000).max(50000)}).strict();
export type Bounds=z.infer<typeof boundsSchema>;
export type MapLevel=z.infer<typeof mapLevelSchema>;
export type MapView=z.infer<typeof mapViewSchema>;
export const initialMapView:MapView={level:'zhou',selectedId:null,zoom:1,x:0,y:0};

