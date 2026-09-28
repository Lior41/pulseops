import Link from "next/link";
import { requireActor } from "@/server/auth/guard";
import { investigateSearch } from "@/server/services/search";
import { PageHeader, Panel, Empty, SeverityBadge, Field } from "@/components/soc-ui";
import { Button } from "@/components/ui/button";
import { scalarParams, type SearchParams } from "@/lib/query";
import { dateTime, humanize } from "@/lib/utils";
import { z } from "zod";
export default async function Search({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireActor();
  const q = z
    .string()
    .trim()
    .max(100)
    .catch("")
    .parse(scalarParams(await searchParams).q);
  const results = q.length >= 2 ? await investigateSearch(q) : null;
  return (
    <>
      <PageHeader
        eyebrow="Connect the evidence"
        title="Investigation search"
        description="Trace an IP, email, hostname, event type or case reference across the workspace."
      />
      <form className="panel mb-6 flex items-end gap-3 p-5">
        <div className="flex-1">
          <Field label="Search all telemetry">
            <input
              autoFocus
              className="field"
              name="q"
              defaultValue={q}
              minLength={2}
              maxLength={100}
              placeholder="203.0.113.42, Sarah, FAILED_LOGIN…"
              required
            />
          </Field>
        </div>
        <Button>Investigate</Button>
      </form>
      {results ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {["Events", "Alerts", "Incidents", "Identities", "Assets"].map((label, i) => (
              <a
                href={`#${label.toLowerCase()}`}
                className="panel p-4 hover:border-primary/40"
                key={label}
              >
                <p className="text-2xl font-medium">{results.counts[i].toLocaleString("en-US")}</p>
                <p className="eyebrow mt-2">{label}</p>
              </a>
            ))}
          </div>
          <p className="mb-5 text-xs text-muted-foreground">
            Showing up to 20 matches per category. Refine your search to narrow the investigation.
          </p>
          <div className="grid gap-6 xl:grid-cols-2">
            <div id="alerts">
              <Panel title="Alerts">
                {results.alerts.map((a) => (
                  <Link
                    className="flex items-center justify-between gap-3 border-b p-4 hover:bg-secondary/50"
                    href={`/alerts/${a.id}`}
                    key={a.id}
                  >
                    <span className="text-xs">
                      {a.title}
                      <span className="mono mt-1 block text-[10px] text-muted-foreground">
                        {a.reference}
                      </span>
                    </span>
                    <SeverityBadge severity={a.severity} />
                  </Link>
                ))}
                {!results.alerts.length && <Empty />}
              </Panel>
            </div>
            <div id="incidents">
              <Panel title="Incidents">
                {results.incidents.map((i) => (
                  <Link
                    className="flex items-center justify-between gap-3 border-b p-4 hover:bg-secondary/50"
                    href={`/incidents/${i.id}`}
                    key={i.id}
                  >
                    <span className="text-xs">
                      {i.title}
                      <span className="mono mt-1 block text-[10px] text-muted-foreground">
                        {i.reference}
                      </span>
                    </span>
                    <SeverityBadge severity={i.severity} />
                  </Link>
                ))}
                {!results.incidents.length && <Empty />}
              </Panel>
            </div>
            <div id="events" className="xl:col-span-2">
              <Panel title="Security events">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Time / UTC</th>
                        <th>Event</th>
                        <th>Severity</th>
                        <th>Identity</th>
                        <th>IP address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.events.map((e) => (
                        <tr key={e.id}>
                          <td>{dateTime(e.occurredAt)}</td>
                          <td className="capitalize">{humanize(e.type)}</td>
                          <td>
                            <SeverityBadge severity={e.severity} />
                          </td>
                          <td>{e.identity?.email ?? "System"}</td>
                          <td className="mono">{e.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!results.events.length && <Empty />}
              </Panel>
            </div>
            <div id="identities">
              <Panel title="Identities">
                {results.identities.map((p) => (
                  <Link
                    key={p.id}
                    className="block border-b p-4 hover:bg-secondary/50"
                    href={`/users/${p.id}`}
                  >
                    <p className="text-sm">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.email} · {p.department}
                    </p>
                  </Link>
                ))}
                {!results.identities.length && <Empty />}
              </Panel>
            </div>
            <div id="assets">
              <Panel title="Assets">
                {results.assets.map((a) => (
                  <Link
                    key={a.id}
                    className="block border-b p-4 hover:bg-secondary/50"
                    href={`/assets/${a.id}`}
                  >
                    <p className="mono text-sm">{a.hostname}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.ipAddress} · {a.operatingSystem}
                    </p>
                  </Link>
                ))}
                {!results.assets.length && <Empty />}
              </Panel>
            </div>
          </div>
        </>
      ) : (
        <div className="panel">
          <Empty
            title="Start with a signal"
            description="Enter at least two characters. For example: Sarah, 203.0.113, or failed login."
          />
        </div>
      )}
    </>
  );
}
