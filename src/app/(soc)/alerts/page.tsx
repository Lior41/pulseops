import Link from "next/link";
import { z } from "zod";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader, SeverityBadge, StatusBadge, Empty, Field } from "@/components/soc-ui";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { severities, alertStatuses, categories } from "@/lib/domain";
import { geography, countryName } from "@/lib/geo";
import { dateTime, humanize } from "@/lib/utils";
import { scalarParams, type SearchParams } from "@/lib/query";
import type { Prisma } from "@/generated/prisma/client";
const filterSchema = z.object({
  q: z.string().max(100).catch(""),
  severity: z.enum(["", ...severities]).catch(""),
  status: z.enum(["", ...alertStatuses]).catch(""),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .catch(""),
  category: z.enum(["", ...categories]).catch(""),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => !Number.isNaN(new Date(s).getTime()))
    .catch(""),
  sort: z.enum(["newest", "oldest", "severity"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
});
export default async function Alerts({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireActor();
  const params = await searchParams;
  const filters = filterSchema.parse(scalarParams(params));
  const where: Prisma.AlertWhereInput = {
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.country ? { countryCode: filters.country } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.date
      ? {
          createdAt: {
            gte: new Date(`${filters.date}T00:00:00Z`),
            lt: new Date(new Date(`${filters.date}T00:00:00Z`).getTime() + 86400000),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { reference: { contains: filters.q, mode: "insensitive" } },
            { sourceIp: { contains: filters.q } },
            { identity: { email: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const total = await db.alert.count({ where });
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / 20)));
  const alerts = await db.alert.findMany({
    where,
    include: { identity: true },
    take: 20,
    skip: (page - 1) * 20,
    orderBy:
      filters.sort === "severity"
        ? [{ severity: "desc" }, { createdAt: "desc" }, { id: "desc" }]
        : [{ createdAt: filters.sort === "oldest" ? "asc" : "desc" }, { id: "desc" }],
  });
  return (
    <>
      <PageHeader
        eyebrow="Detection & response"
        title="Alert inbox"
        description="Triage signals, follow the evidence and decide what needs investigation."
      />
      <form className="panel mb-5 space-y-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Field label="Search alerts">
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Alert, email or source IP..."
                className="field"
                maxLength={100}
              />
            </Field>
          </div>
          <Field label="Severity">
            <select className="field" name="severity" defaultValue={filters.severity}>
              <option value="">All severities</option>
              {[...severities].reverse().map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className="field" name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {alertStatuses.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <select className="field" name="country" defaultValue={filters.country}>
              <option value="">All countries</option>
              {Object.entries(geography).map(([code, g]) => (
                <option key={code} value={code}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Category">
            <select className="field" name="category" defaultValue={filters.category}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Detected on / UTC">
            <input className="field" type="date" name="date" defaultValue={filters.date} />
          </Field>
          <Field label="Sort by">
            <select className="field" name="sort" defaultValue={filters.sort}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="severity">Highest severity</option>
            </select>
          </Field>
          <Button type="submit">Apply filters</Button>
          <Link
            href="/alerts"
            className="px-2 py-2 text-xs text-muted-foreground hover:text-primary"
          >
            Reset
          </Link>
        </div>
      </form>
      <div className="panel overflow-hidden">
        {alerts.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Alert</th>
                  <th>User</th>
                  <th>Source IP</th>
                  <th>Country</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td>
                      <Link href={`/alerts/${a.id}`} className="font-medium hover:text-primary">
                        {a.title}
                      </Link>
                      <p className="mono mt-1 text-[9px] text-muted-foreground">{a.reference}</p>
                    </td>
                    <td>
                      <p>{a.identity?.name ?? "System"}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {a.identity?.email ?? "Endpoint signal"}
                      </p>
                    </td>
                    <td className="mono text-muted-foreground">{a.sourceIp ?? "—"}</td>
                    <td className="text-muted-foreground">{countryName(a.countryCode)}</td>
                    <td className="text-muted-foreground">{dateTime(a.createdAt)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No alerts match"
            description="Adjust the filters or clear the search to see other detections."
          />
        )}
        <Pagination path="/alerts" params={params} page={page} total={total} />
      </div>
    </>
  );
}
