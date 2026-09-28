"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { preferencesAction, roleAction, organizationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Panel } from "@/components/soc-ui";
import type { UserRole } from "@/lib/domain";
export function Preferences({ name, notifications }: { name: string; notifications: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const { setTheme } = useTheme();
  const router = useRouter();
  return (
    <Panel title="General & notifications" subtitle="Preferences for this SOC account">
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          start(async () => {
            setError("");
            const result = await preferencesAction({
              name: form.get("name"),
              timezone: "UTC",
              notifications: form.get("notifications") === "on",
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            toast.success("Preferences saved");
            router.refresh();
          });
        }}
      >
        <Field label="Display name">
          <input
            className="field"
            name="name"
            defaultValue={name}
            minLength={2}
            maxLength={80}
            required
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Operational timestamps are shown in UTC so every analyst shares the same timeline.
        </p>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="notifications"
            defaultChecked={notifications}
            className="accent-primary"
          />
          Receive new in-app notifications
        </label>
        <p className="text-xs text-muted-foreground">
          Existing notifications remain in your inbox. Email delivery is not configured.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setTheme("dark")}>
            Dark theme
          </Button>
          <Button type="button" variant="outline" onClick={() => setTheme("light")}>
            Light theme
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-rose-400">
            {error}
          </p>
        )}
        <Button disabled={pending}>{pending ? "Saving…" : "Save preferences"}</Button>
      </form>
    </Panel>
  );
}
export function OrganizationForm({ name }: { name: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-wrap items-end gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        start(async () => {
          const result = await organizationAction({
            organizationName: form.get("organizationName"),
          });
          if (!result.ok) setError(result.error);
          else {
            setError("");
            toast.success("Workspace updated");
          }
        });
      }}
    >
      <div className="flex-1">
        <Field label="Organization name">
          <input
            className="field"
            name="organizationName"
            defaultValue={name}
            minLength={2}
            maxLength={70}
            required
          />
        </Field>
      </div>
      <Button disabled={pending}>Save workspace</Button>
      {error && (
        <p role="alert" className="w-full text-xs text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
export function RoleEditor({ id, role }: { id: string; role: UserRole }) {
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState(role);
  return (
    <div className="flex items-center gap-2">
      <select
        className="field w-auto"
        aria-label="Account role"
        value={selected}
        onChange={(e) => setSelected(e.target.value as UserRole)}
      >
        {["ADMIN", "ANALYST", "VIEWER"].map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <Button
        size="sm"
        variant="outline"
        disabled={pending || selected === role}
        onClick={() =>
          start(async () => {
            const result = await roleAction({ id, role: selected });
            if (result.ok) toast.success("Role updated. Existing sessions were revoked.");
            else toast.error(result.error);
          })
        }
      >
        Save role
      </Button>
    </div>
  );
}
export function EndSession() {
  return (
    <Button variant="outline" onClick={() => void signOut({ callbackUrl: "/login" })}>
      Sign out of this session
    </Button>
  );
}
