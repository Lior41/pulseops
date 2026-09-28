import { createHash } from "node:crypto";
import { db } from "@/server/db";
import { authorizeTransaction } from "@/server/auth/transaction";
import type { Actor } from "@/server/auth/guard";
import { rateLimit } from "@/server/auth/rate-limit";
import { validateAnalysis, type AnalysisResult, type Severity } from "@/lib/domain";
import { AppError } from "@/server/errors";
import { z } from "zod";
export function demoAnalysis(
  alert: { description: string; severity: Severity; ruleId: string },
  events: { id: string; type: string }[],
): AnalysisResult {
  return validateAnalysis(
    {
      summary: `${alert.description} This assessment is generated from the detection rule and its linked evidence. Verify the identity owner's activity before concluding that the account is compromised.`,
      riskLevel: alert.severity,
      evidence: events.slice(-6).map((e) => ({
        eventId: e.id,
        observation: `Recorded ${e.type.toLowerCase().replaceAll("_", " ")} in the detection window.`,
      })),
      recommendedActions: [
        {
          title: "Verify the identity owner's activity",
          rationale: "Confirm the time, device and location through a trusted channel.",
        },
        {
          title: "Review related authentication history",
          rationale: "Correlate failed and successful sign-ins with device activity.",
        },
        {
          title: "Contain only after verification",
          rationale:
            "An authorized operator could revoke suspicious sessions in a real environment. PulseOps performs no external action.",
        },
      ],
      confidence: alert.ruleId === "AUTH-003" ? 82 : 70,
      limitations: [
        "Deterministic demo analysis; no model was called.",
        "Confidence is illustrative, not a calibrated probability.",
        "All telemetry is simulated.",
      ],
    },
    events.map((e) => e.id),
  );
}
export async function analyzeAlert(actor: Actor, raw: unknown) {
  const { id } = z.object({ id: z.uuid() }).parse(raw);
  await rateLimit(`analysis:${actor.id}`, 12, 3600);
  await rateLimit("analysis:global", 40, 3600);
  const alert = await db.alert.findUnique({
    where: { id },
    include: {
      events: { include: { event: true }, orderBy: { event: { occurredAt: "asc" } }, take: 30 },
    },
  });
  if (!alert) throw new AppError("NOT_FOUND", "Alert not found.", 404);
  const events = alert.events.map(({ event }) => event);
  if (!events.length)
    throw new AppError("NO_EVIDENCE", "This alert has no linked evidence to analyze.");
  const evidenceHash = createHash("sha256")
    .update(JSON.stringify(events.map((e) => e.id)))
    .digest("hex");
  const result = demoAnalysis(alert, events);
  return db.$transaction(async (tx) => {
    await authorizeTransaction(tx, actor, "analyze");
    const saved = await tx.aIAnalysis.create({
      data: {
        alertId: id,
        requestedById: actor.id,
        mode: "DEMO",
        promptVersion: "pulseops-analyst-v1",
        evidenceHash,
        result,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "AI_ANALYSIS_CREATED",
        resourceType: "Alert",
        resourceId: id,
        changes: { mode: "DEMO", analysisId: saved.id },
      },
    });
    return { id: saved.id, mode: "DEMO" as const, result };
  });
}
