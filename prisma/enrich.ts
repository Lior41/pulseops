import { createHash } from "node:crypto";
import { db } from "../src/server/db";
import { ingest } from "../src/server/detection/ingest";
import type { EventType } from "../src/lib/domain";
export async function enrichSeed() {
  if (await db.simulationState.findUnique({ where: { id: "seed-v2-categories" } })) return;
  await db.securityEvent.updateMany({
    where: { source: "seed-baseline", type: "NEW_DEVICE" },
    data: { category: "ENDPOINT" },
  });
  const identities = await db.monitoredIdentity.findMany({ orderBy: { email: "asc" }, take: 50 });
  const signals: [EventType, "API" | "IDENTITY" | "ENDPOINT" | "DATA" | "NETWORK"][] = [
    ["API_ABUSE", "API"],
    ["PRIVILEGE_ESCALATION", "IDENTITY"],
    ["MALWARE_DETECTED", "ENDPOINT"],
    ["SUSPICIOUS_DOWNLOAD", "DATA"],
    ["BRUTE_FORCE", "NETWORK"],
  ];
  for (let i = 0; i < 50; i++) {
    const [type, category] = signals[i % signals.length];
    const identity = identities[i];
    const occurredAt = new Date(Date.now() - (2 + i / 12) * 86400000);
    const sourceEventId = createHash("sha256").update(`category-${i}`).digest("hex");
    const event = await ingest({
      source: "seed-scenario",
      sourceEventId,
      type,
      category,
      severity: type === "MALWARE_DETECTED" ? "CRITICAL" : "HIGH",
      occurredAt,
      identityId: identity.id,
      ipAddress: `198.51.100.${i + 1}`,
      countryCode: identity.homeCountry,
      metadata: { detail: "Historical simulated signal. No real endpoint or network operation." },
    });
    await db.alert.updateMany({
      where: { events: { some: { eventId: event.id } }, status: "OPEN", resolutionReason: null },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(occurredAt.getTime() + 3600000),
        resolutionReason: "Historical synthetic scenario reviewed during demo initialization.",
      },
    });
  }
  await db.simulationState.create({ data: { id: "seed-v2-categories" } });
}
