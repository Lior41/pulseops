import Link from "next/link";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader, SeverityBadge, StatusBadge, Field, Empty } from "@/components/soc-ui";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { scalarParams, type SearchParams } from "@/lib/query";
import { riskScore, riskLevel } from "@/server/services/risk";
import { dateTime } from "@/lib/utils";
import { z } from "zod";
export default async function Assets({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireActor();
  const params = await searchParams;
  const f = z
    .object({
      q: z.string().max(100).catch(""),
      page: z.coerce.number().int().positive().max(10000).catch(1),
    })
    .parse(scalarParams(params));
  const where = {
    OR: [
      { hostname: { contains: f.q, mode: "insensitive" as const } },
      { ipAddress: { contains: f.q } },
      { operatingSystem: { contains: f.q, mode: "insensitive" as const } },
    ],
  };
  const total = await db.asset.count({ where });
  const page = Math.min(f.page, Math.max(1, Math.ceil(total / 20)));
  const assets = await db.asset.findMany({
    where,
    include: { owner: { select: { name: true } } },
    orderBy: { hostname: "asc" },
    take: 20,
    skip: (page - 1) * 20,
  });
  const alerts = await db.alert.findMany({
    where: {
      status: { in: ["OPEN", "INVESTIGATING"] },
      events: { some: { event: { assetId: { in: assets.map((a) => a.id) } } } },
    },
    select: {
      id: true,
      severity: true,
      events: { select: { event: { select: { assetId: true } } } },
    },
  });
  return (
    <>
      <PageHeader
        eyebrow="Endpoint visibility"
        title="Asset inventory"
        description="Ownership, recent activity and risk across your simulated environment."
      />
      <form className="panel mb-5 flex items-end gap-3 p-4">
        <div className="flex-1">
          <Field label="Search assets">
            <input
              className="field"
              name="q"
              defaultValue={f.q}
              maxLength={100}
              placeholder="Hostname, IP or operating system…"
            />
          </Field>
        </div>
        <Button>Search</Button>
      </form>
      <div className="panel overflow-hidden">
        {assets.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Operating system</th>
                  <th>Status</th>
                  <th>IP address</th>
                  <th>Last seen / UTC</th>
                  <th>Owner</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        href={`/assets/${a.id}`}
                        className="mono font-medium hover:text-primary"
                      >
                        {a.hostname}
                      </Link>
                    </td>
                    <td>{a.operatingSystem}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="mono text-muted-foreground">{a.ipAddress}</td>
                    <td className="text-muted-foreground">
                      {a.lastSeenAt ? dateTime(a.lastSeenAt) : "Never"}
                    </td>
                    <td>{a.owner?.name ?? "Infrastructure"}</td>
                    <td>
                      <SeverityBadge
                        severity={riskLevel(
                          riskScore(
                            alerts.filter((x) => x.events.some((e) => e.event.assetId === a.id)),
                          ),
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pagination path="/assets" params={params} page={page} total={total} />
      </div>
    </>
  );
}
