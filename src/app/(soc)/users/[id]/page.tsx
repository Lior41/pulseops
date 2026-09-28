import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader, Panel, SeverityBadge, StatusBadge, Empty } from "@/components/soc-ui";
import { EventTimeline } from "@/features/events/timeline";
import { countryName } from "@/lib/geo";
import { dateTime } from "@/lib/utils";
import { riskScore, riskLevel } from "@/server/services/risk";
export default async function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  await requireActor();
  const { id } = await params;
  const person = await db.monitoredIdentity.findUnique({
    where: { id },
    include: {
      assets: true,
      alerts: { orderBy: { createdAt: "desc" }, take: 50 },
      events: { include: { asset: true }, orderBy: { occurredAt: "desc" }, take: 50 },
      _count: { select: { events: true, alerts: true } },
    },
  });
  if (!person) notFound();
  const [active, origins] = await Promise.all([
    db.alert.findMany({
      where: { identityId: id, status: { in: ["OPEN", "INVESTIGATING"] } },
      select: { severity: true },
    }),
    db.securityEvent.groupBy({
      by: ["ipAddress", "countryCode"],
      where: { identityId: id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 15,
    }),
  ]);
  const risk = riskScore(active);
  return (
    <>
      <Link href="/users" className="mb-5 inline-block text-xs text-muted-foreground">
        ← All identities
      </Link>
      <PageHeader
        eyebrow="User risk profile"
        title={person.name}
        description={`${person.email} · ${person.department}`}
      >
        <SeverityBadge severity={riskLevel(risk)} />
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Risk score", `${risk} / 100`],
          ["Active alerts", String(active.length)],
          ["Home country", countryName(person.homeCountry)],
        ].map(([k, v]) => (
          <div className="panel p-5" key={k}>
            <p className="eyebrow">{k}</p>
            <p className="mt-3 text-xl">{v}</p>
          </div>
        ))}
      </div>
      <p className="mb-6 text-xs text-muted-foreground">
        Risk is a transparent demo heuristic: active severity weights × 4, capped at 100. It is not
        a validated threat probability.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Activity & authentication history"
          subtitle={`Latest ${person.events.length} of ${person._count.events} recorded events`}
        >
          <EventTimeline events={person.events} />
        </Panel>
        <div className="space-y-6">
          <Panel
            title="Associated alerts"
            subtitle={`Latest ${person.alerts.length} of ${person._count.alerts}`}
          >
            <div className="divide-y">
              {person.alerts.map((a) => (
                <Link
                  key={a.id}
                  href={`/alerts/${a.id}`}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-secondary/50"
                >
                  <div>
                    <p className="text-xs font-medium">{a.title}</p>
                    <div className="mt-2">
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                  <SeverityBadge severity={a.severity} />
                </Link>
              ))}
              {!person.alerts.length && <Empty title="No associated alerts" />}
            </div>
          </Panel>
          <Panel title="Devices">
            <div className="divide-y">
              {person.assets.map((a) => (
                <Link
                  key={a.id}
                  href={`/assets/${a.id}`}
                  className="block p-5 hover:bg-secondary/50"
                >
                  <p className="mono text-xs">{a.hostname}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.operatingSystem} · {a.ipAddress}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Last seen {a.lastSeenAt ? dateTime(a.lastSeenAt) : "unknown"}
                  </p>
                </Link>
              ))}
              {!person.assets.length && <Empty title="No assigned devices" />}
            </div>
          </Panel>
          <Panel
            title="Observed origins"
            subtitle="Top 15 IP / country pairs · simulated locations"
          >
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>IP address</th>
                    <th>Country</th>
                    <th>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {origins.map((o, i) => (
                    <tr key={i}>
                      <td>
                        <Link
                          className="mono hover:text-primary"
                          href={`/search?q=${encodeURIComponent(o.ipAddress ?? person.email)}`}
                        >
                          {o.ipAddress ?? "Unknown"}
                        </Link>
                      </td>
                      <td>{countryName(o.countryCode)}</td>
                      <td>{o._count.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
