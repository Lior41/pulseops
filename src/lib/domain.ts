import { z } from "zod";

export const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const alertStatuses = ["OPEN", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"] as const;
export const incidentStatuses = ["OPEN", "INVESTIGATING", "CONTAINED", "RESOLVED"] as const;
export const roles = ["ADMIN", "ANALYST", "VIEWER"] as const;
export const eventTypes = ["NORMAL_LOGIN", "FAILED_LOGIN", "NEW_DEVICE", "NEW_COUNTRY", "BRUTE_FORCE", "PRIVILEGE_ESCALATION", "MALWARE_DETECTED", "SUSPICIOUS_DOWNLOAD", "API_ABUSE"] as const;
export const categories = ["AUTHENTICATION", "IDENTITY", "ENDPOINT", "NETWORK", "DATA", "API"] as const;
export type Severity = typeof severities[number];
export type UserRole = typeof roles[number];
export type EventType = typeof eventTypes[number];
export const severityWeight: Record<Severity, number> = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 12 };
export const severityRank: Record<Severity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
export const eventSchema = z.object({
  source: z.string().min(1).max(60), sourceEventId: z.string().min(1).max(160),
  type: z.enum(eventTypes), category: z.enum(categories), severity: z.enum(severities),
  occurredAt: z.coerce.date(), identityId: z.string().max(100).nullable().default(null),
  assetId: z.string().max(100).nullable().default(null),
  ipAddress: z.union([z.ipv4(),z.ipv6()]).nullable().default(null),
  countryCode: z.string().regex(/^[A-Z]{2}$/).nullable().default(null),
  metadata: z.object({newCountry:z.boolean().optional(),bytes:z.number().nonnegative().optional(),detail:z.string().max(500).optional()}).strict().default({}),
});
export type EventInput = z.infer<typeof eventSchema>;
export type DetectionEvent = EventInput & { id: string };
export function securityScore(alerts: {severity:Severity;status:string}[]) {
  return Math.max(0,100-alerts.filter(a=>a.status==="OPEN"||a.status==="INVESTIGATING").reduce((sum,a)=>sum+severityWeight[a.severity],0));
}
export const loginSchema = z.object({email:z.email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(8).max(128)});
export const analysisSchema = z.object({
  summary:z.string().min(15).max(1600),riskLevel:z.enum(severities),
  evidence:z.array(z.object({eventId:z.string(),observation:z.string().min(3).max(500)})).min(1).max(30),
  recommendedActions:z.array(z.object({title:z.string().min(3).max(140),rationale:z.string().min(3).max(500)})).min(1).max(8),
  confidence:z.number().min(0).max(100),limitations:z.array(z.string().max(500)).min(1).max(6),
}).strict();
export type AnalysisResult = z.infer<typeof analysisSchema>;
export function validateAnalysis(raw:unknown,evidenceIds:string[]) {
  const result=analysisSchema.parse(raw);
  if(result.evidence.some(e=>!evidenceIds.includes(e.eventId))) throw new Error("Analysis cites an event outside the evidence set.");
  return result;
}
