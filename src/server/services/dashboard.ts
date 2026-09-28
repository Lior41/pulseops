import {db} from "@/server/db";
import {securityScore} from "@/lib/domain";
export async function dashboardData(){
  const now=new Date();const today=new Date(now);today.setUTCHours(0,0,0,0);const week=new Date(now.getTime()-7*86400000);
  const [active,eventsToday,identities,assets,latest,countries,categories,severities,scores,incidents]=await Promise.all([
    db.alert.findMany({where:{status:{in:["OPEN","INVESTIGATING"]}},select:{severity:true,status:true}}),
    db.securityEvent.count({where:{occurredAt:{gte:today}}}),db.monitoredIdentity.count({where:{isActive:true}}),db.asset.count(),
    db.alert.findMany({where:{status:{in:["OPEN","INVESTIGATING"]}},orderBy:[{severity:"desc"},{createdAt:"desc"}],take:5,include:{identity:true}}),
    db.securityEvent.groupBy({by:["countryCode"],where:{occurredAt:{gte:week}},_count:{_all:true}}),
    db.securityEvent.groupBy({by:["category"],where:{occurredAt:{gte:week}},_count:{_all:true}}),
    db.securityEvent.groupBy({by:["severity"],where:{occurredAt:{gte:week}},_count:{_all:true}}),
    db.scoreSnapshot.findMany({where:{bucketStart:{gte:week}},orderBy:{bucketStart:"asc"}}),
    db.incident.findMany({where:{createdAt:{gte:week}},select:{createdAt:true,severity:true}}),
  ]);
  const score=securityScore(active);const reference=scores.filter(s=>s.bucketStart.getTime()<=now.getTime()-86400000).at(-1);
  const incidentDays=Array.from({length:7},(_,i)=>{const at=new Date(today.getTime()-(6-i)*86400000);const day=at.toISOString().slice(0,10);return {time:at.toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"}),incidents:incidents.filter(x=>x.createdAt.toISOString().startsWith(day)).length};});
  const incidentHours=Array.from({length:24},(_,i)=>{const at=new Date(Math.floor(now.getTime()/3600000)*3600000-(23-i)*3600000);return {time:at.toISOString().slice(11,16),incidents:incidents.filter(x=>x.createdAt>=at&&x.createdAt.getTime()<at.getTime()+3600000).length};});
  return {score,delta:reference?score-reference.score:null,active:active.length,critical:active.filter(a=>a.severity==="CRITICAL").length,eventsToday,identities,assets,latest,countries:countries.map(c=>({code:c.countryCode??"??",count:c._count._all})).sort((a,b)=>b.count-a.count),categories:categories.map(c=>({name:c.category,value:c._count._all})),severities:severities.map(c=>({name:c.severity,value:c._count._all})),scores:scores.map(s=>({time:s.bucketStart.toISOString(),score:s.score})),incidentDays,incidentHours};
}
