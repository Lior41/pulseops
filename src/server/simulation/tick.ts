import {db} from "@/server/db";
import {ingestWithin,recordScore} from "@/server/detection/ingest";
import {generateEvent} from "./generator";
export async function tick(){
  if(process.env.DEMO_MODE!=="true")return {generated:false};
  return db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(71301)`;
    const state=await tx.simulationState.upsert({where:{id:"live"},create:{id:"live",nextTickAt:new Date(0)},update:{}});
    if(state.nextTickAt>new Date())return {generated:false};
    const identities=await tx.monitoredIdentity.findMany({where:{isActive:true},orderBy:{id:"asc"},take:120});
    if(!identities.length)return {generated:false};
    const identity=identities[state.counter%identities.length];
    const asset=await tx.asset.findFirst({where:{ownerId:identity.id}});
    const event=await ingestWithin(tx,generateEvent(state.counter,identity,asset?.id??null));
    await tx.simulationState.update({where:{id:"live"},data:{counter:{increment:1},nextTickAt:new Date(Date.now()+4000)}});
    await recordScore(tx);
    return {generated:true,id:event.id};
  },{timeout:20000,maxWait:10000});
}
