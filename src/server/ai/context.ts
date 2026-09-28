import {z} from "zod";
import {eventTypes} from "@/lib/domain";
const syntheticEvent=z.object({id:z.string(),type:z.enum(eventTypes),occurredAt:z.coerce.date(),simulated:z.literal(true),source:z.enum(["seed-scenario","seed-baseline","pulseops-simulator"])});
export function anonymousSyntheticContext(raw:unknown){
  const events=z.array(syntheticEvent).min(1).max(30).parse(raw);
  const start=Math.min(...events.map(e=>e.occurredAt.getTime()));
  const references=new Map(events.map((e,i)=>[`E${i+1}`,e.id]));
  // Only these three allowlisted values may leave the application. No actual
  // identity, database ID, IP, country, date, free text or raw log is included.
  const payload={synthetic:true,events:events.map((e,i)=>({reference:`E${i+1}`,type:e.type,secondsFromStart:Math.round((e.occurredAt.getTime()-start)/1000)}))};
  return {payload,references};
}
