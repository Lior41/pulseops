import {NextResponse} from "next/server";
import {z} from "zod";
import {requireActor} from "@/server/auth/guard";
import {db} from "@/server/db";
import {apiError,checkOrigin} from "@/server/http";
export async function GET(){try{const actor=await requireActor();const [items,unread]=await Promise.all([db.notification.findMany({where:{userId:actor.id},orderBy:{createdAt:"desc"},take:30}),db.notification.count({where:{userId:actor.id,readAt:null}})]);return NextResponse.json({items,unread},{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
export async function PATCH(request:Request){try{checkOrigin(request);const actor=await requireActor();const {id}=z.object({id:z.string().max(100)}).parse(await request.json());await db.notification.updateMany({where:{id,userId:actor.id},data:{readAt:new Date()}});return NextResponse.json({ok:true});}catch(e){return apiError(e);}}
