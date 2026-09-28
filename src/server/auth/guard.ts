import {auth} from "@/auth";
import {db} from "@/server/db";
import {can,type Capability} from "./permissions";
import {AppError} from "@/server/errors";
import type {Prisma} from "@/generated/prisma/client";
export type Actor={id:string;name:string;email:string;role:"ADMIN"|"ANALYST"|"VIEWER";sessionVersion:number};
export async function requireActor(capability:Capability="read"):Promise<Actor>{
  const session=await auth();
  if(!session?.user?.id)throw new AppError("UNAUTHENTICATED","Please sign in.",401);
  const user=await db.user.findUnique({where:{id:session.user.id}});
  if(!user?.isActive||user.sessionVersion!==session.user.sessionVersion)throw new AppError("UNAUTHENTICATED","Your session has expired. Please sign in again.",401);
  if(!can(user.role,capability))throw new AppError("FORBIDDEN","Your role does not permit this action.",403);
  return {id:user.id,name:user.name,email:user.email,role:user.role,sessionVersion:user.sessionVersion};
}
export async function authorizeTransaction(tx:Prisma.TransactionClient,actor:Actor,capability:Capability){
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`actor:${actor.id}`}))`;
  const current=await tx.user.findUnique({where:{id:actor.id}});
  if(!current?.isActive||current.sessionVersion!==actor.sessionVersion||!can(current.role,capability))throw new AppError("FORBIDDEN","Permission changed. Sign in again.",403);
  return current;
}
