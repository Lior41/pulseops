import {z} from "zod";
import {severities,eventTypes,categories} from "./domain";
export const wireEventSchema=z.object({id:z.string(),sequence:z.string().regex(/^\d+$/),type:z.enum(eventTypes),severity:z.enum(severities),category:z.enum(categories),occurredAt:z.string(),ipAddress:z.string().nullable(),countryCode:z.string().nullable(),identity:z.object({name:z.string(),email:z.string()}).nullable()});
export type WireEvent=z.infer<typeof wireEventSchema>;
export function toWire(event:{id:string;sequence:bigint;type:WireEvent["type"];severity:WireEvent["severity"];category:WireEvent["category"];occurredAt:Date;ipAddress:string|null;countryCode:string|null;identity:{name:string;email:string}|null}):WireEvent{return {...event,sequence:event.sequence.toString(),occurredAt:event.occurredAt.toISOString(),identity:event.identity?{name:event.identity.name,email:event.identity.email}:null};}
