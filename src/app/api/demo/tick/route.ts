import {NextResponse} from "next/server";
import {requireActor} from "@/server/auth/guard";
import {tick} from "@/server/simulation/tick";
import {apiError,checkOrigin} from "@/server/http";
import {rateLimit} from "@/server/auth/rate-limit";
export async function POST(request:Request){try{checkOrigin(request);const actor=await requireActor("investigate");if(process.env.DEMO_MODE!=="true")return NextResponse.json({error:"Demo simulation is disabled."},{status:403});await rateLimit(`tick:${actor.id}`,30,60);return NextResponse.json(await tick());}catch(e){return apiError(e);}}
