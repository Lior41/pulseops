import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { ingest } from "@/server/detection/ingest";
import {
  updateAlert,
  createIncident,
  updateIncident,
  addComment,
} from "@/server/services/investigations";
import { changeRole } from "@/server/services/settings";
import type { Actor } from "@/server/auth/guard";
const identityId = randomUUID();
const source = `integration-${randomUUID()}`;
let analyst: Actor;
let viewer: Actor;
let admin: Actor;
let alertId: string;
let incidentId: string;
beforeAll(async () => {
  await db.monitoredIdentity.create({
    data: {
      id: identityId,
      name: "Integration fixture",
      email: `${identityId}@fixture.example`,
      department: "Quality",
      homeCountry: "FR",
      knownCountries: ["FR"],
    },
  });
  const users = await Promise.all(
    (["ANALYST", "VIEWER", "ADMIN"] as const).map((role) =>
      db.user.create({
        data: { name: `Fixture ${role}`, email: `${randomUUID()}@fixture.example`, role },
      }),
    ),
  );
  [analyst, viewer, admin] = users;
});
afterAll(async () => {
  await db.$disconnect();
});
describe("Persistent detection and analyst workflow", () => {
  it("generates exactly one medium alert from five persisted failures and ignores retries", async () => {
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const event = {
        source,
        sourceEventId: String(i),
        type: "FAILED_LOGIN",
        category: "AUTHENTICATION",
        severity: "LOW",
        occurredAt: new Date(now.getTime() + i * 1000),
        identityId,
        ipAddress: "198.51.100.243",
        countryCode: "DE",
        metadata: {},
      };
      await ingest(event);
      await ingest(event);
    }
    const events = await db.securityEvent.findMany({ where: { source } });
    expect(events).toHaveLength(5);
    const alerts = await db.alert.findMany({ where: { identityId }, include: { events: true } });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("MEDIUM");
    expect(alerts[0].events).toHaveLength(5);
    alertId = alerts[0].id;
    expect(events[4].occurredAt.getTime() - events[0].occurredAt.getTime()).toBe(4000);
  });
  it("rejects a viewer at the service boundary", async () => {
    await expect(
      updateAlert(viewer, { id: alertId, version: 1, status: "INVESTIGATING" }),
    ).rejects.toMatchObject({ status: 403 });
    expect((await db.alert.findUniqueOrThrow({ where: { id: alertId } })).status).toBe("OPEN");
  });
  it("updates status and rejects an obsolete version", async () => {
    await updateAlert(analyst, { id: alertId, version: 1, status: "INVESTIGATING" });
    await expect(
      updateAlert(analyst, {
        id: alertId,
        version: 1,
        status: "RESOLVED",
        reason: "Verified known activity",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("creates an incident once, links evidence and records its audit trail", async () => {
    const input = {
      alertId,
      title: "Investigate authentication failures",
      description: "Review repeated simulated authentication failures.",
      severity: "MEDIUM",
    };
    const first = await createIncident(analyst, input);
    const retry = await createIncident(analyst, input);
    expect(retry.id).toBe(first.id);
    incidentId = first.id;
    expect(await db.incidentEvent.count({ where: { incidentId } })).toBe(5);
    expect(
      await db.auditLog.count({ where: { resourceId: incidentId, action: "INCIDENT_CREATED" } }),
    ).toBe(1);
  });
  it("persists a note and requires a resolution summary", async () => {
    await addComment(analyst, {
      incidentId,
      body: "Verified the simulated identity owner's activity.",
    });
    await expect(
      updateIncident(analyst, {
        id: incidentId,
        version: 1,
        status: "RESOLVED",
        ownerId: analyst.id,
        summary: "",
      }),
    ).rejects.toThrow();
    await updateIncident(analyst, {
      id: incidentId,
      version: 1,
      status: "RESOLVED",
      ownerId: analyst.id,
      summary: "Confirmed known synthetic activity after evidence review.",
    });
    expect((await db.incident.findUniqueOrThrow({ where: { id: incidentId } })).status).toBe(
      "RESOLVED",
    );
    expect(await db.incidentComment.count({ where: { incidentId } })).toBe(1);
  });
  it("revalidates a stale actor after an administrator changes their role", async () => {
    await changeRole(admin, { id: analyst.id, role: "VIEWER" });
    await expect(
      addComment(analyst, { incidentId, body: "This write must be refused." }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
