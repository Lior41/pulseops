import "dotenv/config";
import { enrichSeed } from "./enrich";
import { hash } from "@node-rs/argon2";
import { createHash } from "node:crypto";
import { db } from "../src/server/db";
import { ingest } from "../src/server/detection/ingest";
import { securityScore, type EventInput } from "../src/lib/domain";
import { seededRandom } from "../src/server/simulation/generator";

if (process.env.DEMO_MODE !== "true")
  throw new Error("Seed is restricted to DEMO_MODE=true. Use a dedicated demo database.");
const id = (key: string) => {
  const h = createHash("sha256").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const demoPassword = process.env.DEMO_PASSWORD;
if (!demoPassword || demoPassword.length < 12)
  throw new Error("Set DEMO_PASSWORD (12+ characters) before seeding.");
const accounts = [
  {
    name: "Alex Morgan",
    email: "demo@pulseops.dev",
    role: "ANALYST" as const,
    password: demoPassword,
  },
  {
    name: "Recruiter Viewer",
    email: "viewer@pulseops.dev",
    role: "VIEWER" as const,
    password: demoPassword,
  },
  ...(process.env.ADMIN_PASSWORD
    ? [
        {
          name: "PulseOps Administrator",
          email: "admin@pulseops.dev",
          role: "ADMIN" as const,
          password: process.env.ADMIN_PASSWORD,
        },
      ]
    : []),
];
for (const account of accounts) {
  const { password, ...data } = account;
  await db.user.upsert({
    where: { email: account.email },
    update: {},
    create: {
      ...data,
      id: id(account.email),
      passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
    },
  });
}
if (await db.simulationState.findUnique({ where: { id: "seed-v1-complete" } })) {
  await enrichSeed();
  console.log("Seed already complete. Existing demo changes preserved.");
  await db.$disconnect();
  process.exit(0);
}
await db.applicationSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
const now = new Date();
now.setMinutes(0, 0, 0);
const random = seededRandom(42026);
const first = [
  "Sarah",
  "Marc",
  "Amira",
  "Daniel",
  "Priya",
  "Noah",
  "Leila",
  "Ethan",
  "Sofia",
  "Oliver",
];
const last = [
  "Cohen",
  "Laurent",
  "Haddad",
  "Kim",
  "Patel",
  "Bennett",
  "Alvarez",
  "Chen",
  "Okafor",
  "Rossi",
  "Sato",
  "Weber",
];
const countries = ["US", "GB", "DE", "FR", "IL", "NL", "JP", "SG", "CA", "AU", "BR", "IN"];
const departments = ["Finance", "Engineering", "Operations", "Product", "Legal", "People"];
for (let i = 0; i < 120; i++) {
  const name = i === 0 ? "Sarah Cohen" : `${first[i % 10]} ${last[Math.floor(i / 10)]}`;
  const email =
    i === 0
      ? "sarah.cohen@aster.example"
      : `${first[i % 10].toLowerCase()}.${last[Math.floor(i / 10)].toLowerCase()}@aster.example`;
  await db.monitoredIdentity.upsert({
    where: { id: id(`person-${i}`) },
    update: {},
    create: {
      id: id(`person-${i}`),
      name,
      email,
      department: departments[i % 6],
      homeCountry: countries[i % 12],
      knownCountries: [countries[i % 12]],
      lastLoginAt: new Date(now.getTime() - i * 180000),
      lastLoginCountry: countries[i % 12],
    },
  });
}
for (let i = 0; i < 60; i++)
  await db.asset.upsert({
    where: { id: id(`asset-${i}`) },
    update: {},
    create: {
      id: id(`asset-${i}`),
      hostname:
        i === 0
          ? "MACBOOK-FIN-01"
          : i % 3 === 0
            ? `SERVER-PROD-${String(i).padStart(2, "0")}`
            : `AST-${i % 2 ? "MBP" : "WIN"}-${String(i).padStart(3, "0")}`,
      operatingSystem: i % 3 === 0 ? "Ubuntu 24.04" : i % 2 ? "macOS Sequoia" : "Windows 11",
      status: i % 11 === 0 ? "OFFLINE" : "ONLINE",
      ipAddress: `10.20.${Math.floor(i / 250)}.${i + 10}`,
      ownerId: id(`person-${i}`),
      lastSeenAt: new Date(now.getTime() - i * 60000),
    },
  });
const total = Number(process.env.SEED_EVENTS ?? 12000);
for (let offset = 0; offset < total; offset += 400) {
  const data = Array.from({ length: Math.min(400, total - offset) }, (_, j) => {
    const i = offset + j;
    const person = i % 120;
    const failure = random() < 0.08;
    return {
      id: id(`baseline-${i}`),
      source: "seed-baseline",
      sourceEventId: String(i),
      type: failure
        ? ("FAILED_LOGIN" as const)
        : i % 23 === 0
          ? ("NEW_DEVICE" as const)
          : ("NORMAL_LOGIN" as const),
      category: "AUTHENTICATION" as const,
      severity: "LOW" as const,
      occurredAt: new Date(now.getTime() - 7 * 86400000 + (i / total) * 7 * 86400000),
      identityId: id(`person-${person}`),
      assetId: person < 60 ? id(`asset-${person}`) : null,
      ipAddress: `192.0.2.${person + 1}`,
      countryCode: countries[person % 12],
      metadata: { detail: "Simulated organizational baseline." },
    };
  });
  await db.securityEvent.createMany({ data, skipDuplicates: true });
}
for (let scenario = 0; scenario < 22; scenario++) {
  const person = scenario === 21 ? 0 : scenario + 1;
  const base = now.getTime() - (scenario === 21 ? 10 * 60000 : (22 - scenario) * 6 * 3600000);
  for (let j = 0; j < 11; j++) {
    const success = j === 10;
    const event: EventInput = {
      source: "seed-scenario",
      sourceEventId: `${scenario}-${j}`,
      type: success ? "NORMAL_LOGIN" : "FAILED_LOGIN",
      category: "AUTHENTICATION",
      severity: success ? "HIGH" : "MEDIUM",
      occurredAt: new Date(base + j * 15000),
      identityId: id(`person-${person}`),
      assetId: id(`asset-${person}`),
      ipAddress: `203.0.113.${40 + scenario}`,
      countryCode: scenario === 21 ? "DE" : countries[(person + 3) % 12],
      metadata: {
        newCountry: success,
        detail: success
          ? "Authentication succeeded from a previously unseen country."
          : "Password authentication failed.",
      },
    };
    await ingest(event);
  }
}
const alerts = await db.alert.findMany({ orderBy: { createdAt: "asc" } });
for (let i = 0; i < alerts.length - 5; i++)
  await db.alert.update({
    where: { id: alerts[i].id },
    data: {
      status: i % 7 === 0 ? "FALSE_POSITIVE" : "RESOLVED",
      resolvedAt: new Date(alerts[i].createdAt.getTime() + 3600000),
      resolutionReason: "Seeded investigation: user activity verified in this fictional scenario.",
    },
  });
const ownerId = id("demo@pulseops.dev");
for (let i = 0; i < 8; i++) {
  const alert = alerts[Math.min(alerts.length - 1, i * 5)];
  const incidentId = id(`incident-${i}`);
  const resolved = i < 6;
  await db.incident.upsert({
    where: { id: incidentId },
    update: {},
    create: {
      id: incidentId,
      reference: `INC-${1041 + i}`,
      title: i === 7 ? "Unfamiliar sign-in sequence · Finance" : alert.title,
      description: alert.description,
      severity: alert.severity,
      status: resolved ? "RESOLVED" : "INVESTIGATING",
      ownerId,
      createdById: ownerId,
      createdAt: alert.createdAt,
      resolvedAt: resolved ? new Date(alert.createdAt.getTime() + 3600000) : null,
      resolutionSummary: resolved
        ? "Fictional user confirmed the activity. Investigation closed."
        : null,
    },
  });
  await db.alert.update({
    where: { id: alert.id },
    data: {
      incidentId,
      ...(!resolved ? { status: "INVESTIGATING", resolvedAt: null, resolutionReason: null } : {}),
    },
  });
  const links = await db.alertEvent.findMany({ where: { alertId: alert.id } });
  await db.incidentEvent.createMany({
    data: links.map((e) => ({ incidentId, eventId: e.eventId })),
    skipDuplicates: true,
  });
  await db.incidentComment.upsert({
    where: { id: id(`comment-${i}`) },
    update: {},
    create: {
      id: id(`comment-${i}`),
      incidentId,
      authorId: ownerId,
      body: resolved
        ? "Reviewed the authentication history and verified this simulated activity with the identity owner."
        : "Investigation opened. Reviewing the authentication sequence and related device activity.",
    },
  });
  await db.auditLog.upsert({
    where: { id: id(`audit-${i}`) },
    update: {},
    create: {
      id: id(`audit-${i}`),
      actorId: ownerId,
      action: "INCIDENT_CREATED",
      resourceType: "Incident",
      resourceId: incidentId,
      changes: { sourceAlert: alert.reference },
      createdAt: alert.createdAt,
    },
  });
}
await enrichSeed();
const allAlerts = await db.alert.findMany();
for (let hour = 0; hour <= 168; hour++) {
  const at = new Date(now.getTime() - (168 - hour) * 3600000);
  const atTime = allAlerts
    .filter((a) => a.createdAt <= at)
    .map((a) => ({ ...a, status: a.resolvedAt && a.resolvedAt <= at ? a.status : "OPEN" }));
  await db.scoreSnapshot.upsert({
    where: { bucketStart: at },
    update: {},
    create: {
      bucketStart: at,
      score: securityScore(atTime),
      activeAlerts: atTime.filter((a) => a.status === "OPEN" || a.status === "INVESTIGATING")
        .length,
      measuredAt: at,
      simulated: true,
    },
  });
}
await db.simulationState.create({ data: { id: "seed-v1-complete", counter: total } });
console.log(
  `Seed complete: ${total + 242} events, 120 monitored identities, 60 assets, ${alerts.length} rule-generated alerts, 8 incidents.`,
);
await db.$disconnect();
