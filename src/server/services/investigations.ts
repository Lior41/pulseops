import {randomUUID} from "node:crypto";
import {z} from "zod";
import {db} from "@/server/db";
import {authorizeTransaction} from "@/server/auth/transaction";
import type {Actor} from "@/server/auth/guard";
import {alertStatuses,incidentStatuses} from "@/lib/domain";
import {AppError} from "@/server/errors";
import {notify} from "./notifications";
import {recordScore} from "@/server/detection/ingest";
export const alertUpdateSchema=z.object({id:z.uuid(),version:z.number().int().positive(),status:z.enum(alertStatuses),reason:z.string().trim().max(1000).default("")}).refine(x=>!["RESOLVED","FALSE_POSITIVE"].includes(x.status)||x.reason.length>=8,{message:"Add a resolution reason of at least 8 characters."});
export async function updateAlert(actor:Actor,raw:unknown){const input=alertUpdateSchema.parse(raw);return db.$transaction(async tx=>{
  await authorizeTransaction(tx,actor,"investigate");
  const previous=await tx.alert.findUnique({where:{id:input.id}});if(!previous)throw new AppError("NOT_FOUND","Alert not found.",404);
  const changed=await tx.alert.updateMany({where:{id:input.id,version:input.version},data:{status:input.status,version:{increment:1},resolvedAt:["RESOLVED","FALSE_POSITIVE"].includes(input.status)?new Date():null,resolutionReason:input.reason||null}});
  if(!changed.count)throw new AppError("CONFLICT","This alert changed. Refresh before trying again.",409);
  await tx.auditLog.create({data:{actorId:actor.id,action:"ALERT_STATUS_CHANGED",resourceType:"Alert",resourceId:input.id,changes:{from:previous.status,to:input.status,reason:input.reason}}});
  await recordScore(tx);return {id:input.id};
});}
export const createIncidentSchema=z.object({alertId:z.uuid().optional(),title:z.string().trim().min(5).max(160),description:z.string().trim().min(10).max(3000),severity:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"])});
export async function createIncident(actor:Actor,raw:unknown){const input=createIncidentSchema.parse(raw);return db.$transaction(async tx=>{
  await authorizeTransaction(tx,actor,"investigate");
  if(input.alertId)await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`alert:${input.alertId}`}))`;
  const alert=input.alertId?await tx.alert.findUnique({where:{id:input.alertId},include:{events:true}}):null;
  if(input.alertId&&!alert)throw new AppError("NOT_FOUND","Alert not found.",404);
  if(alert?.incidentId)return {id:alert.incidentId};
  if(alert&&["RESOLVED","FALSE_POSITIVE"].includes(alert.status))throw new AppError("CLOSED","Reopen the alert before creating an incident.");
  const id=randomUUID();
  await tx.incident.create({data:{id,reference:`INC-${id.slice(0,8).toUpperCase()}`,title:input.title,description:input.description,severity:alert?.severity??input.severity,ownerId:actor.id,createdById:actor.id,status:"INVESTIGATING"}});
  if(alert){await tx.alert.update({where:{id:alert.id},data:{incidentId:id,status:"INVESTIGATING",version:{increment:1}}});await tx.incidentEvent.createMany({data:alert.events.map(e=>({incidentId:id,eventId:e.eventId})),skipDuplicates:true});await tx.auditLog.create({data:{actorId:actor.id,action:"ALERT_STATUS_CHANGED",resourceType:"Alert",resourceId:alert.id,changes:{from:alert.status,to:"INVESTIGATING",incidentId:id}}});}
  await tx.auditLog.create({data:{actorId:actor.id,action:"INCIDENT_CREATED",resourceType:"Incident",resourceId:id,changes:{alertId:alert?.id??null}}});
  await notify(tx,{type:"INCIDENT_ASSIGNED",title:"New incident assigned",body:input.title,key:`incident:${id}:assigned`,incidentId:id,userId:actor.id});return {id};
});}
const incidentUpdateSchema=z.object({id:z.uuid(),version:z.number().int().positive(),status:z.enum(incidentStatuses),ownerId:z.uuid(),summary:z.string().trim().max(2000).default("")}).refine(x=>x.status!=="RESOLVED"||x.summary.length>=10,{message:"Describe the resolution in at least 10 characters."});
const transitions:Record<string,string[]>={OPEN:["OPEN","INVESTIGATING"],INVESTIGATING:["INVESTIGATING","CONTAINED","RESOLVED"],CONTAINED:["CONTAINED","INVESTIGATING","RESOLVED"],RESOLVED:["RESOLVED","INVESTIGATING"]};
export async function updateIncident(actor:Actor,raw:unknown){const input=incidentUpdateSchema.parse(raw);return db.$transaction(async tx=>{
  await authorizeTransaction(tx,actor,"investigate");
  const previous=await tx.incident.findUnique({where:{id:input.id}});if(!previous)throw new AppError("NOT_FOUND","Incident not found.",404);
  if(!transitions[previous.status].includes(input.status))throw new AppError("TRANSITION","Move this incident to investigating first.");
  const owner=await tx.user.findFirst({where:{id:input.ownerId,isActive:true,role:{in:["ADMIN","ANALYST"]}}});if(!owner)throw new AppError("OWNER","Select an active analyst or administrator.");
  const result=await tx.incident.updateMany({where:{id:input.id,version:input.version},data:{status:input.status,ownerId:input.ownerId,version:{increment:1},resolvedAt:input.status==="RESOLVED"?new Date():null,resolutionSummary:input.status==="RESOLVED"?input.summary:null}});
  if(!result.count)throw new AppError("CONFLICT","This incident changed. Refresh and try again.",409);
  await tx.auditLog.create({data:{actorId:actor.id,action:"INCIDENT_STATUS_CHANGED",resourceType:"Incident",resourceId:input.id,changes:{from:previous.status,to:input.status,ownerId:input.ownerId,summary:input.summary}}});
  if(input.ownerId!==previous.ownerId)await notify(tx,{type:"INCIDENT_ASSIGNED",title:"Incident assigned to you",body:previous.title,key:`incident:${input.id}:owner:${input.version}`,incidentId:input.id,userId:input.ownerId});
  if(input.status==="RESOLVED"&&previous.status!=="RESOLVED")await notify(tx,{type:"INCIDENT_RESOLVED",title:"Incident resolved",body:previous.title,key:`incident:${input.id}:resolved:${input.version}`,incidentId:input.id});return {id:input.id};
});}
export async function addComment(actor:Actor,raw:unknown){const input=z.object({incidentId:z.uuid(),body:z.string().trim().min(3).max(3000)}).parse(raw);return db.$transaction(async tx=>{
  await authorizeTransaction(tx,actor,"investigate");
  if(!await tx.incident.findUnique({where:{id:input.incidentId}}))throw new AppError("NOT_FOUND","Incident not found.",404);
  await tx.incidentComment.create({data:{...input,authorId:actor.id}});
  await tx.auditLog.create({data:{actorId:actor.id,action:"COMMENT_ADDED",resourceType:"Incident",resourceId:input.incidentId}});return {id:input.incidentId};
});}
