import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { db } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { PageHeader } from "@/components/soc-ui";
export default async function Demo() {
  await requireActor();
  const alert = await db.alert.findFirst({
    where: { severity: "CRITICAL" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true, incidentId: true },
  });
  const incident =
    alert?.incidentId ??
    (await db.incident.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }))?.id;
  const steps = [
    {
      title: "Read the security posture",
      description: "Inspect real database aggregates, historical scores and geographic telemetry.",
      href: "/dashboard",
      label: "Open dashboard",
    },
    {
      title: "Follow a critical detection",
      description:
        "Review the sequence of failed authentications and the evidence attached by a versioned rule.",
      href: alert ? `/alerts/${alert.id}` : "/alerts",
      label: "Investigate critical alert",
    },
    {
      title: "Analyze the evidence",
      description:
        "Click Analyze with AI in the alert. Demo analysis is validated, persisted and explicitly labelled as simulated.",
      href: alert ? `/alerts/${alert.id}#analysis` : "/alerts",
      label: "Open analyst workspace",
    },
    {
      title: "Work an incident",
      description:
        "Escalate an alert, add an investigation note, assign the case and document its resolution.",
      href: incident ? `/incidents/${incident}` : "/incidents?create=true",
      label: "Open investigation",
    },
    {
      title: "Watch signals arrive",
      description:
        "Pause, filter and resume the SSE stream. Every generated event is synthetic and persisted.",
      href: "/events",
      label: "Watch live telemetry",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Recruiter demo · approximately 5 minutes"
        title="One investigation. The complete picture."
        description="Explore the full path from synthetic telemetry to a documented response."
      />
      <div className="panel mb-6 flex items-start gap-4 p-5">
        <ShieldCheck className="shrink-0 text-primary" size={24} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          You are in a shared fictional workspace. Changes persist. No real endpoints are connected,
          no offensive action runs, and no external AI provider receives data.
        </p>
      </div>
      <div className="space-y-4">
        {steps.map((s, i) => (
          <Link
            key={s.title}
            href={s.href}
            className="panel group flex flex-wrap items-center gap-5 p-6 transition-colors hover:border-primary/40"
          >
            <span className="mono grid h-12 w-12 shrink-0 place-items-center rounded-lg border text-primary">
              0{i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-medium">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            </div>
            <span className="flex items-center gap-2 text-xs text-primary">
              {s.label}
              <ArrowUpRight size={16} />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
