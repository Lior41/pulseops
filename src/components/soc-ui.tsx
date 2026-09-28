import { cn, humanize } from "@/lib/utils";
import type { Severity } from "@/lib/domain";
import { Inbox, ArrowUpRight } from "lucide-react";
import Link from "next/link";
export function SeverityBadge({ severity }: { severity: Severity }) {
  const colors = {
    CRITICAL: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
        colors[severity],
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {severity}
    </span>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs capitalize",
        ["RESOLVED", "ONLINE"].includes(status) ? "text-primary" : "text-muted-foreground",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {humanize(status)}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[29px]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {subtitle && <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  title = "Nothing to review",
  description = "No results match the current filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <Inbox className="mb-2 h-7 w-7 text-muted-foreground" />
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
export function ViewLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
    >
      {children}
      <ArrowUpRight size={13} />
    </Link>
  );
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
