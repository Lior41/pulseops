import { db } from "@/server/db";
import { eventTypes } from "@/lib/domain";
import type { Prisma } from "@/generated/prisma/client";
export async function investigateSearch(q: string) {
  const contains = { contains: q, mode: "insensitive" as const };
  const matchingTypes = eventTypes.filter((type) =>
    type.toLowerCase().includes(q.toLowerCase().replaceAll(" ", "_")),
  );
  const eventWhere: Prisma.SecurityEventWhereInput = {
    OR: [
      { ipAddress: { contains: q } },
      { type: { in: matchingTypes } },
      { identity: { OR: [{ email: contains }, { name: contains }] } },
      { asset: { hostname: contains } },
    ],
  };
  const alertWhere: Prisma.AlertWhereInput = {
    OR: [
      { title: contains },
      { reference: contains },
      { sourceIp: { contains: q } },
      { identity: { OR: [{ email: contains }, { name: contains }] } },
      { events: { some: { event: eventWhere } } },
    ],
  };
  const incidentWhere: Prisma.IncidentWhereInput = {
    OR: [
      { title: contains },
      { reference: contains },
      { events: { some: { event: eventWhere } } },
      { alerts: { some: alertWhere } },
    ],
  };
  const identityWhere = { OR: [{ name: contains }, { email: contains }] };
  const assetWhere = { OR: [{ hostname: contains }, { ipAddress: { contains: q } }] };
  const [events, alerts, incidents, identities, assets, counts] = await Promise.all([
    db.securityEvent.findMany({
      where: eventWhere,
      include: { identity: { select: { email: true } } },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
    db.alert.findMany({ where: alertWhere, orderBy: { createdAt: "desc" }, take: 20 }),
    db.incident.findMany({ where: incidentWhere, orderBy: { createdAt: "desc" }, take: 20 }),
    db.monitoredIdentity.findMany({ where: identityWhere, take: 20, orderBy: { name: "asc" } }),
    db.asset.findMany({ where: assetWhere, take: 20, orderBy: { hostname: "asc" } }),
    Promise.all([
      db.securityEvent.count({ where: eventWhere }),
      db.alert.count({ where: alertWhere }),
      db.incident.count({ where: incidentWhere }),
      db.monitoredIdentity.count({ where: identityWhere }),
      db.asset.count({ where: assetWhere }),
    ]),
  ]);
  return { events, alerts, incidents, identities, assets, counts };
}
