import {z} from "zod";
import {requireActor} from "@/server/auth/guard";
import {db} from "@/server/db";
import {apiError} from "@/server/http";
import {toWire} from "@/lib/events";
export const dynamic="force-dynamic";
export const maxDuration=30;
export async function GET(request:Request){try{
  const actor=await requireActor();const params=new URL(request.url).searchParams;
  const raw=request.headers.get("last-event-id")??params.get("after")??"0";
  let cursor=BigInt(z.string().regex(/^\d{1,19}$/).parse(raw));
  let closed=false;const encoder=new TextEncoder();
  const stream=new ReadableStream<Uint8Array>({async start(controller){
    const send=(text:string)=>{if(!closed)controller.enqueue(encoder.encode(text));};
    const close=()=>{if(!closed){closed=true;try{controller.close();}catch{ /* The browser already closed the connection. */ }}};
    const onAbort=()=>close();request.signal.addEventListener("abort",onAbort,{once:true});
    const deadline=Date.now()+24000;
    try{send("retry: 1500\n\n");while(!closed&&Date.now()<deadline){
      const user=await db.user.findUnique({where:{id:actor.id},select:{isActive:true,sessionVersion:true}});
      if(!user?.isActive||user.sessionVersion!==actor.sessionVersion){send("event: unauthorized\ndata: {}\n\n");break;}
      const events=await db.securityEvent.findMany({where:{sequence:{gt:cursor}},include:{identity:{select:{name:true,email:true}}},orderBy:{sequence:"asc"},take:101});
      if(events.length>100){const recent=await db.securityEvent.findMany({include:{identity:{select:{name:true,email:true}}},orderBy:{sequence:"desc"},take:50});cursor=recent[0].sequence;send(`id: ${cursor}\nevent: snapshot\ndata: ${JSON.stringify(recent.map(toWire))}\n\n`);}
      else for(const event of events){cursor=event.sequence;send(`id: ${cursor}\nevent: telemetry\ndata: ${JSON.stringify(toWire(event))}\n\n`);}
      send(": heartbeat\n\n");await new Promise(resolve=>setTimeout(resolve,2500));
    }}catch{if(!closed)send("event: unavailable\ndata: {}\n\n");}finally{request.signal.removeEventListener("abort",onAbort);close();}
  },cancel(){closed=true;}});
  return new Response(stream,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no"}});
}catch(e){return apiError(e);}}
