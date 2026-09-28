import Link from "next/link";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader, SeverityBadge, Empty, Field } from "@/components/soc-ui";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { dateTime } from "@/lib/utils";
import { countryName } from "@/lib/geo";
import { scalarParams, type SearchParams } from "@/lib/query";
import { riskScore, riskLevel } from "@/server/services/risk";
import { z } from "zod";
export default async function Users({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
      { name: { contains: f.q, mode: "insensitive" as const } },
      { email: { contains: f.q, mode: "insensitive" as const } },
      { department: { contains: f.q, mode: "insensitive" as const } },
    ],
  };
  const total = await db.monitoredIdentity.count({ where });
  const page = Math.min(f.page, Math.max(1, Math.ceil(total / 20)));
  const users = await db.monitoredIdentity.findMany({
    where,
    include: { alerts: { select: { severity: true, status: true, incidentId: true } } },
    orderBy: { name: "asc" },
    take: 20,
    skip: (page - 1) * 20,
  });
  return (
    <>
      <PageHeader
        eyebrow="Identity intelligence"
        title="Monitored identities"
        description="Understand the people behind the signals. These fictional identities do not have access to PulseOps."
      />
      <form className="panel mb-5 flex items-end gap-3 p-4">
        <div className="flex-1">
          <Field label="Search identities">
            <input
              className="field"
              name="q"
              defaultValue={f.q}
              maxLength={100}
              placeholder="Name, email or department…"
            />
          </Field>
        </div>
        <Button>Search</Button>
      </form>
      <div className="panel overflow-hidden">
        {users.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Department</th>
                  <th>Last login / UTC</th>
                  <th>Country</th>
                  <th>Incidents</th>
                  <th>Active alerts</th>
                  <th>Risk score</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const active = u.alerts.filter((a) =>
                    ["OPEN", "INVESTIGATING"].includes(a.status),
                  );
                  const risk = riskScore(active);
                  return (
                    <tr key={u.id}>
                      <td>
                        <Link className="font-medium hover:text-primary" href={`/users/${u.id}`}>
                          {u.name}
                        </Link>
                        <p className="mt-1 text-[10px] text-muted-foreground">{u.email}</p>
                      </td>
                      <td>{u.department}</td>
                      <td className="text-muted-foreground">
                        {u.lastLoginAt ? dateTime(u.lastLoginAt) : "No login recorded"}
                      </td>
                      <td>{countryName(u.lastLoginCountry ?? u.homeCountry)}</td>
                      <td>
                        {
                          new Set(u.alerts.flatMap((a) => (a.incidentId ? [a.incidentId] : [])))
                            .size
                        }
                      </td>
                      <td>{active.length}</td>
                      <td>
                        <span className="mr-3 mono">{risk}</span>
                        <SeverityBadge severity={riskLevel(risk)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pagination path="/users" params={params} page={page} total={total} />
      </div>
    </>
  );
}
