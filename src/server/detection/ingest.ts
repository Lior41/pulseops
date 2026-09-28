import {randomUUID} from "node:crypto";
import {db} from "@/server/db";
import {eventSchema,securityScore,type DetectionEvent} from "@/lib/domain";
import {detect} from "./rules";
import {notify} from "@/server/services/notifications";
import type {Prisma} from "@/generated/prisma/client";

export async function ingestWithin(tx:Prisma.TransactionClient,raw:unknown){
  const input=eventSchema.parse(raw);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(71301)`;
  const existing=await tx.securityEvent.findUnique({where:{source_sourceEventId:{source:input.source,sourceEventId:input.sourceEventId}}});
  if(existing)return existing;
  const event=await tx.securityEvent.create({data:{...input,id:randomUUID()}});
  const history=await tx.securityEvent.findMany({where:{type:"FAILED_LOGIN",occurredAt:{gte:new Date(input.occurredAt.getTime()-300000),lte:input.occurredAt},OR:[...(input.identityId?[{identityId:input.identityId}]:[]),...(input.ipAddress?[{ipAddress:input.ipAddress}]:[])]},orderBy:{occurredAt:"desc"},take:500});
  const normalized:DetectionEvent={...input,id:event.id};
  const rules=detect(normalized,history.map(e=>({...e,metadata:eventSchema.shape.metadata.parse(e.metadata)})));
  for(const rule of rules){
    let alert=await tx.alert.findFirst({where:{ruleId:rule.ruleId,subjectKey:rule.subjectKey,suppressionUntil:{gt:input.occurredAt},firstSeenAt:{lte:input.occurredAt}},orderBy:{firstSeenAt:"desc"}});
    if(!alert){
      const id=randomUUID();
      alert=await tx.alert.create({data:{id,reference:`ALT-${id.slice(0,8).toUpperCase()}`,title:rule.title,description:rule.description,severity:rule.severity,category:input.category,ruleId:rule.ruleId,subjectKey:rule.subjectKey,deduplicationKey:`${rule.ruleId}:${rule.subjectKey}:${event.id}`,suppressionUntil:new Date(input.occurredAt.getTime()+300000),identityId:input.identityId,sourceIp:input.ipAddress,countryCode:input.countryCode,firstSeenAt:input.occurredAt,lastSeenAt:input.occurredAt,createdAt:input.occurredAt}});
      await tx.auditLog.create({data:{action:"ALERT_CREATED",resourceType:"Alert",resourceId:id,changes:{ruleId:rule.ruleId,severity:rule.severity},createdAt:input.occurredAt}});
      if(rule.severity==="CRITICAL")await notify(tx,{type:"CRITICAL_ALERT",title:rule.title,body:"A critical simulated detection needs review.",key:`alert:${id}`,alertId:id});
    }else await tx.alert.update({where:{id:alert.id},data:{lastSeenAt:input.occurredAt,description:rule.description,version:{increment:1}}});
    await tx.alertEvent.createMany({data:rule.evidenceIds.map(eventId=>({alertId:alert.id,eventId})),skipDuplicates:true});
  }
  if(input.identityId&&input.type==="NORMAL_LOGIN")await tx.monitoredIdentity.update({where:{id:input.identityId},data:{lastLoginAt:input.occurredAt,lastLoginCountry:input.countryCode}});
  if(input.assetId)await tx.asset.update({where:{id:input.assetId},data:{lastSeenAt:input.occurredAt,status:"ONLINE"}});
  return event;
}
export async function ingest(raw:unknown){return db.$transaction(tx=>ingestWithin(tx,raw),{timeout:20000,maxWait:20000});}
export async function recordScore(tx:Prisma.TransactionClient){
  const alerts=await tx.alert.findMany({where:{status:{in:["OPEN","INVESTIGATING"]}},select:{severity:true,status:true}});
  const score=securityScore(alerts);const now=new Date();const bucketStart=new Date(Math.floor(now.getTime()/3600000)*3600000);
  const previous=await tx.scoreSnapshot.findFirst({orderBy:{bucketStart:"desc"}});
  await tx.scoreSnapshot.upsert({where:{bucketStart},create:{bucketStart,score,activeAlerts:alerts.length,measuredAt:now},update:{score,activeAlerts:alerts.length,measuredAt:now}});
  if(previous&&previous.score-score>=5)await notify(tx,{type:"SCORE_DECREASED",title:"Security score decreased",body:`Score changed from ${previous.score} to ${score}. Review active detections.`,key:`score:${bucketStart.toISOString()}`});
  return score;
}
