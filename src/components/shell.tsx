"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import {
  Activity,
  LayoutDashboard,
  ShieldAlert,
  FolderSearch,
  Users,
  Server,
  Globe2,
  Radio,
  Search,
  Settings,
  ScrollText,
  Bell,
  Command as CommandIcon,
  Menu,
  LogOut,
  ArrowUpRight,
  Moon,
} from "lucide-react";
import { Command } from "cmdk";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Actor } from "@/server/auth/guard";
import { toast } from "sonner";
const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/incidents", label: "Incidents", icon: FolderSearch },
  { href: "/events", label: "Live events", icon: Radio },
  { href: "/threat-map", label: "Threat map", icon: Globe2 },
  { href: "/users", label: "Identities", icon: Users },
  { href: "/assets", label: "Assets", icon: Server },
  { href: "/search", label: "Investigation search", icon: Search },
];
type Notice = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  alertId: string | null;
  incidentId: string | null;
};
export function Shell({
  actor,
  organization,
  children,
}: {
  actor: Actor;
  organization: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeError, setNoticeError] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    async function load() {
      try {
        const r = await fetch("/api/notifications", { signal: abort.signal });
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (active) {
          setNotices(data.items);
          setUnread(data.unread);
          setNoticeError(false);
        }
      } catch {
        if (active) setNoticeError(true);
      }
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => {
      active = false;
      abort.abort();
      clearInterval(timer);
    };
  }, []);
  const go = (href: string) => {
    setPalette(false);
    setMobile(false);
    setQuery("");
    router.push(href);
  };
  async function readNotice(notice: Notice) {
    try {
      const r = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notice.id }),
      });
      if (!r.ok) throw new Error();
      setNotices((items) =>
        items.map((n) => (n.id === notice.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnread((n) => Math.max(0, n - (notice.readAt ? 0 : 1)));
      setNoticeOpen(false);
      if (notice.incidentId) go(`/incidents/${notice.incidentId}`);
      else if (notice.alertId) go(`/alerts/${notice.alertId}`);
    } catch {
      toast.error("Unable to mark notification as read.");
    }
  }
  const nav = (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-5 py-8 text-base font-bold tracking-[.16em]"
      >
        <Activity size={23} className="text-primary" />
        PULSEOPS
      </Link>
      <div className="mx-4 mb-8 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="grid h-8 w-8 place-items-center rounded-md border text-xs font-semibold">
          AL
        </div>
        <div>
          <p className="text-xs font-medium">{organization}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Demo workspace</p>
        </div>
      </div>
      <p className="eyebrow px-6 pb-3">Operations</p>
      <nav aria-label="Main navigation" className="space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            onClick={() => setMobile(false)}
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-xs transition-colors",
              pathname.startsWith(href)
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 px-3">
        <p className="eyebrow px-3 pb-3">Workspace</p>
        {actor.role === "ADMIN" && (
          <Link
            href="/audit"
            className="flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground"
          >
            <ScrollText size={16} />
            Audit trail
          </Link>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground"
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
      <div className="mt-auto p-4">
        <Link href="/demo" className="block rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex justify-between text-xs font-medium text-primary">
            Explore the demo
            <ArrowUpRight size={14} />
          </div>
          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
            One investigation. The complete picture.
          </p>
        </Link>
        <button
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="mt-5 flex w-full items-center gap-3 rounded p-1 text-left"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-[10px]">
            {actor.name
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <p className="text-xs">{actor.name}</p>
            <p className="mt-1 text-[9px] capitalize text-muted-foreground">
              {actor.role.toLowerCase()}
            </p>
          </div>
          <LogOut className="ml-auto text-muted-foreground" size={14} />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </>
  );
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 bg-primary p-3 text-black focus:not-sr-only focus:fixed"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col overflow-y-auto border-r bg-card lg:flex">
        {nav}
      </aside>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="flex h-[95vh] max-w-xs flex-col gap-0 overflow-auto p-0">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <DialogDescription className="sr-only">PulseOps workspace pages</DialogDescription>
          {nav}
        </DialogContent>
      </Dialog>
      <div className="lg:ml-[224px]">
        <header className="flex h-16 items-center justify-between gap-4 border-b px-5 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </Button>
            <span className="text-xs text-muted-foreground">Workspace</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs capitalize">
              {pathname.split("/")[1].replaceAll("-", " ")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPalette(true)}
              className="flex items-center gap-3 rounded-md border px-3 py-1.5 text-xs text-muted-foreground"
              aria-label="Open command palette"
            >
              <Search size={14} />
              <span className="hidden md:inline">Search anything...</span>
              <kbd className="hidden rounded bg-muted px-1 py-.5 text-[10px] sm:block">⌘ K</kbd>
            </button>
            <span className="hidden items-center gap-1.5 text-[10px] text-muted-foreground md:flex">
              <span className="h-1 w-1 rounded-full bg-primary" />
              SIMULATED
            </span>
            <button
              className="relative p-1 text-muted-foreground"
              aria-label={`Notifications, ${unread} unread`}
              onClick={() => setNoticeOpen(true)}
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[8px] text-background">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1680px] px-5 py-7 md:px-8">
          {children}
        </main>
        <footer className="flex flex-wrap justify-between gap-2 px-8 pb-5 text-[10px] text-muted-foreground">
          <span>Demo / simulated telemetry · Shared fictional workspace</span>
          <span>PULSEOPS · Defensive security operations</span>
        </footer>
      </div>
      <Dialog open={palette} onOpenChange={setPalette}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Navigate, search or change appearance
          </DialogDescription>
          <Command className="p-3">
            <div className="flex items-center gap-2 border-b px-2 pb-3">
              <CommandIcon size={16} />
              <Command.Input
                autoFocus
                placeholder="Where do you want to go?"
                value={query}
                onValueChange={setQuery}
                className="w-full bg-transparent p-2 outline-none"
              />
            </div>
            <Command.List className="max-h-80 overflow-auto pt-2">
              <Command.Empty className="p-4 text-muted-foreground">
                No matching command.
              </Command.Empty>
              {links.map((link) => (
                <Command.Item
                  key={link.href}
                  value={`Open ${link.label}`}
                  onSelect={() => go(link.href)}
                  className="cursor-pointer rounded px-3 py-3 text-sm data-[selected=true]:bg-muted"
                >
                  Open {link.label}
                </Command.Item>
              ))}
              {actor.role !== "VIEWER" && (
                <Command.Item
                  value="Create incident"
                  onSelect={() => go("/incidents?create=true")}
                  className="rounded p-3 data-[selected=true]:bg-muted"
                >
                  Create incident
                </Command.Item>
              )}
              <Command.Item
                value={`${query} Search all data`}
                onSelect={() => go(`/search?q=${encodeURIComponent(query)}`)}
                className="rounded p-3 data-[selected=true]:bg-muted"
              >
                Search all data{query ? ` for “${query}”` : ""}
              </Command.Item>
              <Command.Item
                value="Switch theme"
                onSelect={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setPalette(false);
                }}
                className="flex items-center gap-2 rounded p-3 data-[selected=true]:bg-muted"
              >
                <Moon size={14} />
                Switch theme
              </Command.Item>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Activity in this shared demo workspace.</DialogDescription>
          {noticeError ? (
            <p role="alert">Notifications are temporarily unavailable.</p>
          ) : notices.length ? (
            <div className="max-h-96 overflow-auto">
              {notices.map((n) => (
                <button
                  key={n.id}
                  onClick={() => void readNotice(n)}
                  className="mb-2 w-full rounded-md border p-3 text-left hover:bg-muted"
                >
                  <p className={cn("text-sm", !n.readAt && "text-primary")}>{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                  <span className="mt-2 block text-[10px] text-muted-foreground">
                    {n.readAt ? "Read" : "Mark as read and open"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">You’re all caught up.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
