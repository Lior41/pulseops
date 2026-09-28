import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/guard";
import { AppError } from "@/server/errors";
import { Shell } from "@/components/shell";
import { db } from "@/server/db";
export const dynamic = "force-dynamic";
export default async function SocLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor().catch((error) => {
    if (error instanceof AppError && error.status === 401) redirect("/login");
    throw error;
  });
  const settings = await db.applicationSettings.findUnique({ where: { id: "main" } });
  return (
    <Shell actor={actor} organization={settings?.organizationName ?? "Aster Labs"}>
      {children}
    </Shell>
  );
}
