import {requireActor} from "@/server/auth/guard";
import {db} from "@/server/db";
import {toWire} from "@/lib/events";
import {PageHeader} from "@/components/soc-ui";
import {LiveFeed} from "@/features/events/live-feed";
export default async function Events(){const actor=await requireActor();const events=await db.securityEvent.findMany({include:{identity:{select:{name:true,email:true}}},orderBy:{sequence:"desc"},take:100});return <><PageHeader eyebrow="Telemetry" title="Live events" description="A continuous view of simulated signals. No external systems are contacted."/><LiveFeed initial={events.map(toWire)} canSimulate={process.env.DEMO_MODE==="true"&&actor.role!=="VIEWER"}/></>;}
