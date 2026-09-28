import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader, Panel, SeverityBadge, StatusBadge, Empty } from "@/components/soc-ui";
import { EventTimeline } from "@/features/events/timeline";
import { IncidentControls, CommentForm } from "@/features/incidents/incident-controls";
import { dateTime, humanize } from "@/lib/utils";
export default async function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      createdBy: { select: { name: true } },
      alerts: true,
      events: {
        include: { event: { include: { identity: true, asset: true } } },
        orderBy: { event: { occurredAt: "asc" } },
        take: 150,
      },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      _count: { select: { events: true, comments: true } },
    },
  });
  if (!incident) notFound();
  const [owners, audits] = await Promise.all([
    db.user.findMany({
      where: { isActive: true, role: { in: ["ADMIN", "ANALYST"] } },
      select: { id: true, name: true },
    }),
    db.auditLog.findMany({
      where: { resourceType: "Incident", resourceId: id },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  return (
    <>
      <Link
        href="/incidents"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-primary"
      >
        ← All incidents
      </Link>
      <PageHeader
        eyebrow={incident.reference}
        title={incident.title}
        description={`Opened ${dateTime(incident.createdAt)} by ${incident.createdBy.name}`}
      >
        <SeverityBadge severity={incident.severity} />
        <StatusBadge status={incident.status} />
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Case owner", incident.owner?.name ?? "Unassigned"],
          ["Linked evidence", `${incident._count.events} events`],
          ["Investigation notes", String(incident._count.comments)],
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="eyebrow">{label}</p>
            <p className="mt-3 text-lg font-medium">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="Investigation brief">
            <p className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-muted-foreground">
              {incident.description}
            </p>
            {incident.resolutionSummary && (
              <div className="border-t bg-primary/5 p-5">
                <p className="eyebrow text-primary">Resolution</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{incident.resolutionSummary}</p>
              </div>
            )}
          </Panel>
          <Panel
            title="Event timeline"
            subtitle={`Chronological evidence · showing ${incident.events.length} of ${incident._count.events} events`}
          >
            <EventTimeline events={incident.events.map((e) => e.event)} />
          </Panel>
          <Panel title="Analyst notes" subtitle="Decisions and context preserved with the case">
            {incident.comments.length ? (
              <div className="divide-y">
                {incident.comments.map((c) => (
                  <article key={c.id} className="p-5">
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-medium">{c.author.name}</span>
                      <time className="text-muted-foreground">{dateTime(c.createdAt)}</time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {c.body}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Start the investigation record"
                description="Add a note explaining your findings and next steps."
              />
            )}
            {actor.role !== "VIEWER" && <CommentForm incidentId={id} />}
          </Panel>
        </div>
        <aside className="space-y-6">
          <Panel title="Response workflow" subtitle="Changes are recorded in the audit trail">
            {actor.role !== "VIEWER" ? (
              <IncidentControls
                id={id}
                version={incident.version}
                status={incident.status}
                ownerId={incident.ownerId}
                owners={owners}
                summary={incident.resolutionSummary}
              />
            ) : (
              <p className="p-5 text-sm text-muted-foreground">
                Your viewer account has read-only access.
              </p>
            )}
          </Panel>
          <Panel title="Linked alerts">
            <div className="divide-y">
              {incident.alerts.map((a) => (
                <Link
                  key={a.id}
                  href={`/alerts/${a.id}`}
                  className="block space-y-2 p-5 hover:bg-secondary/50"
                >
                  <SeverityBadge severity={a.severity} />
                  <p className="text-xs font-medium">{a.title}</p>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
              {!incident.alerts.length && (
                <Empty
                  title="Independent investigation"
                  description="This case was created without a source alert."
                />
              )}
            </div>
          </Panel>
          <Panel title="Case activity">
            <ol className="space-y-5 p-5">
              {audits.map((a) => (
                <li key={a.id} className="text-xs">
                  <p className="capitalize">{humanize(a.action)}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {a.actor?.name ?? "Detection engine"} · {dateTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </>
  );
}
