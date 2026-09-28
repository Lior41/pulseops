import {z} from "zod";
import {db} from "@/server/db";
import {authorizeTransaction} from "@/server/auth/transaction";
import type {Actor} from "@/server/auth/guard";
import {AppError} from "@/server/errors";
export async function savePreferences(actor:Actor,raw:unknown){const input=z.object({name:z.string().trim().min(2).max(80),timezone:z.string().refine(v=>{try{new Intl.DateTimeFormat("en",{timeZone:v});return true;}catch{return false;}}),notifications:z.boolean()}).parse(raw);return db.$transaction(async tx=>{await authorizeTransaction(tx,actor,"read");await tx.user.update({where:{id:actor.id},data:{name:input.name,preferences:{timezone:input.timezone,notifications:input.notifications}}});await tx.auditLog.create({data:{actorId:actor.id,action:"SETTINGS_CHANGED",resourceType:"User",resourceId:actor.id,changes:{timezone:input.timezone,notifications:input.notifications}}});return {id:actor.id};});}
export async function changeRole(actor:Actor,raw:unknown){const input=z.object({id:z.uuid(),role:z.enum(["ADMIN","ANALYST","VIEWER"])}).parse(raw);return db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(71302)`;await authorizeTransaction(tx,actor,"admin");
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`actor:${input.id}`}))`;
  const target=await tx.user.findUnique({where:{id:input.id}});if(!target)throw new AppError("NOT_FOUND","User not found.",404);
  if(target.role==="ADMIN"&&input.role!=="ADMIN"&&await tx.user.count({where:{role:"ADMIN",isActive:true}})<=1)throw new AppError("LAST_ADMIN","The last active administrator cannot be demoted.");
  await tx.user.update({where:{id:input.id},data:{role:input.role,sessionVersion:{increment:1}}});
  await tx.auditLog.create({data:{actorId:actor.id,action:"ROLE_CHANGED",resourceType:"User",resourceId:input.id,changes:{from:target.role,to:input.role}}});return {id:input.id};
});}
export async function saveOrganization(actor:Actor,raw:unknown){const input=z.object({organizationName:z.string().trim().min(2).max(70)}).parse(raw);return db.$transaction(async tx=>{await authorizeTransaction(tx,actor,"admin");await tx.applicationSettings.upsert({where:{id:"main"},create:{id:"main",...input},update:input});await tx.auditLog.create({data:{actorId:actor.id,action:"SETTINGS_CHANGED",resourceType:"ApplicationSettings",resourceId:"main",changes:input}});return {id:"main"};});}
