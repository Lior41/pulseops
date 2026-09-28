import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, Fingerprint, Globe2, Monitor, Network } from "lucide-react";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader, Panel, SeverityBadge, StatusBadge } from "@/components/soc-ui";
import { AlertControls } from "@/features/alerts/alert-controls";
import { AnalysisPanel } from "@/features/alerts/analysis-panel";
import { EventTimeline } from "@/features/events/timeline";
import { analysisSchema } from "@/lib/domain";
import { dateTime } from "@/lib/utils";
import { countryName } from "@/lib/geo";
export default async function AlertDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const alert = await db.alert.findUnique({
    where: { id },
    include: {
      identity: true,
      events: {
        include: { event: { include: { asset: true } } },
        orderBy: { event: { occurredAt: "asc" } },
        take: 100,
      },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!alert) notFound();
  const audit = await db.auditLog.findMany({
    where: { resourceType: "Alert", resourceId: id },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const parsed = analysisSchema.safeParse(alert.analyses[0]?.result);
  const latest = parsed.success ? { mode: alert.analyses[0].mode, result: parsed.data } : null;
  const asset = alert.events.find((e) => e.event.asset)?.event.asset;
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
        href="/alerts"
      >
        <ArrowLeft size={13} />
        Alert inbox
      </Link>
      <PageHeader
        eyebrow={`${alert.reference} · ${alert.ruleId}`}
        title={alert.title}
        description={`Detected ${dateTime(alert.createdAt)} · ${alert.events.length} linked events`}
      >
        <AlertControls
          alert={{
            id,
            version: alert.version,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            status: alert.status,
            incidentId: alert.incidentId,
          }}
          allowed={actor.role !== "VIEWER"}
        />
      </PageHeader>
      <div className="mb-5 flex items-center gap-3">
        <SeverityBadge severity={alert.severity} />
        <StatusBadge status={alert.status} />
        <span className="ml-auto text-[10px] text-muted-foreground">
          DEMO / SIMULATED TELEMETRY
        </span>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel
            title="Detection summary"
            action={<ShieldAlert size={16} className="text-orange-400" />}
          >
            <div className="p-5">
              <p className="text-sm leading-7 text-muted-foreground">{alert.description}</p>
              <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
                {[
                  {
                    icon: Fingerprint,
                    label: "Affected identity",
                    value: alert.identity?.email ?? "System",
                    href: alert.identity ? `/users/${alert.identity.id}` : null,
                  },
                  {
                    icon: Network,
                    label: "Source IP",
                    value: alert.sourceIp ?? "Unknown",
                    href: alert.sourceIp ? `/search?q=${alert.sourceIp}` : null,
                  },
                  {
                    icon: Globe2,
                    label: "Approximate origin",
                    value: countryName(alert.countryCode),
                    href: null,
                  },
                  {
                    icon: Monitor,
                    label: "Device",
                    value: asset?.hostname ?? "No linked endpoint",
                    href: asset ? `/assets/${asset.id}` : null,
                  },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label}>
                    <p className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Icon size={13} />
                      {label}
                    </p>
                    {href ? (
                      <Link href={href} className="break-all text-xs text-primary">
                        {value}
                      </Link>
                    ) : (
                      <p className="text-xs">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <Panel
            title="Event timeline"
            subtitle="The evidence behind this detection · chronological order"
          >
            <EventTimeline events={alert.events.map((e) => e.event)} />
          </Panel>
          <Panel
            title="Investigation history"
            subtitle="Persisted analyst and detection-engine activity"
          >
            <div className="divide-y">
              {audit.map((log) => (
                <div key={log.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                  <div>
                    <p className="text-xs capitalize">
                      {log.action.toLowerCase().replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {log.actor?.name ?? "Detection engine"}
                    </p>
                  </div>
                  <p className="mono text-[10px] text-muted-foreground">
                    {dateTime(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <AnalysisPanel id={id} allowed={actor.role !== "VIEWER"} initial={latest} />
      </div>
    </>
  );
}
