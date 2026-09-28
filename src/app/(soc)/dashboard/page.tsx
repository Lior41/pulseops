import Link from "next/link";
import {
  ArrowUpRight,
  Shield,
  ShieldAlert,
  Activity,
  Users,
  Server,
  ArrowRight,
  TriangleAlert,
} from "lucide-react";
import { requireActor } from "@/server/auth/guard";
import { dashboardData } from "@/server/services/dashboard";
import { db } from "@/server/db";
import { PageHeader, Panel, SeverityBadge, StatusBadge, ViewLink } from "@/components/soc-ui";
import { ThreatMap } from "@/features/dashboard/threat-map";
import { IncidentChart, Distribution, ScoreChart } from "@/features/dashboard/charts";
import { LiveFeed } from "@/features/events/live-feed";
import { toWire } from "@/lib/events";
import { number, dateTime } from "@/lib/utils";
export default async function Dashboard() {
  const actor = await requireActor();
  const [data, events] = await Promise.all([
    dashboardData(),
    db.securityEvent.findMany({
      include: { identity: { select: { name: true, email: true } } },
      orderBy: { sequence: "desc" },
      take: 50,
    }),
  ]);
  const stats = [
    {
      label: "Active threats",
      value: data.active,
      icon: ShieldAlert,
      detail: "Open & investigating",
      color: "text-orange-400",
    },
    {
      label: "Critical alerts",
      value: data.critical,
      icon: TriangleAlert,
      detail: "Require attention",
      color: "text-rose-400",
    },
    {
      label: "Events today",
      value: data.eventsToday,
      icon: Activity,
      detail: "Since 00:00 UTC",
      color: "text-primary",
    },
    {
      label: "Identities",
      value: data.identities,
      icon: Users,
      detail: "Actively monitored",
      color: "text-muted-foreground",
    },
    {
      label: "Endpoints",
      value: data.assets,
      icon: Server,
      detail: "In asset inventory",
      color: "text-muted-foreground",
    },
  ];
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Security operations center"
        title="Your environment. In focus."
        description="A clear view of your security posture and the signals that matter."
      >
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs"
        >
          Guided investigation
          <ArrowUpRight size={14} />
        </Link>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <div className="panel relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Security score</p>
            <Shield size={15} className="text-primary" />
          </div>
          <div className="my-3 flex items-end gap-1">
            <strong className="mono text-3xl font-medium text-primary">{data.score}</strong>
            <span className="mb-1 text-xs text-muted-foreground">/ 100</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {data.delta === null
              ? "No baseline"
              : `${data.delta >= 0 ? "+" : ""}${data.delta} since yesterday`}{" "}
            · demo score
          </p>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
            <div className="h-full bg-primary" style={{ width: `${data.score}%` }} />
          </div>
        </div>
        {stats.map(({ label, value, icon: Icon, detail, color }) => (
          <div key={label} className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">{label}</p>
              <Icon size={15} className={color} />
            </div>
            <p className={`mono my-3 text-3xl ${label === "Critical alerts" ? color : ""}`}>
              {number(value)}
            </p>
            <p className="text-[10px] text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
      {data.critical > 0 && (
        <Link
          href="/alerts?severity=CRITICAL"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-orange-400/15 bg-orange-400/[.035] px-4 py-3"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          <span className="text-xs">
            <span className="font-medium text-orange-300">{data.critical} critical detections</span>
            <span className="ml-2 text-muted-foreground">need an analyst’s attention.</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-2 text-[11px] text-orange-300">
            Review alerts
            <ArrowRight size={13} />
          </span>
        </Link>
      )}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <ThreatMap countries={data.countries} />
        <div className="space-y-5">
          <IncidentChart days={data.incidentDays} hours={data.incidentHours} />
          <ScoreChart data={data.scores} />
        </div>
      </div>
      <Panel
        title="Priority investigations"
        subtitle="Active detections, ordered by severity"
        action={<ViewLink href="/alerts">All alerts</ViewLink>}
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Detection</th>
                <th>Identity</th>
                <th>Detected</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((a) => (
                <tr key={a.id}>
                  <td>
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td>
                    <Link href={`/alerts/${a.id}`} className="font-medium hover:text-primary">
                      {a.title}
                    </Link>
                    <p className="mono mt-1 text-[9px] text-muted-foreground">
                      {a.reference} · {a.ruleId}
                    </p>
                  </td>
                  <td className="text-muted-foreground">{a.identity?.name ?? "System"}</td>
                  <td className="text-muted-foreground">{dateTime(a.createdAt)}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    <Link href={`/alerts/${a.id}`} aria-label={`Investigate ${a.reference}`}>
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="grid items-start gap-5 xl:grid-cols-[2fr_1fr]">
        <LiveFeed
          initial={events.map(toWire)}
          canSimulate={process.env.DEMO_MODE === "true" && actor.role !== "VIEWER"}
          compact
        />
        <div className="space-y-5">
          <Distribution title="Events by category" data={data.categories} />
          <Distribution title="Events by severity" data={data.severities} />
        </div>
      </div>
    </div>
  );
}
