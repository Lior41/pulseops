import type { Prisma } from "@/generated/prisma/client";
export async function notify(
  tx: Prisma.TransactionClient,
  input: {
    type: string;
    title: string;
    body: string;
    key: string;
    alertId?: string;
    incidentId?: string;
    userId?: string;
  },
) {
  const users = await tx.user.findMany({
    where: { isActive: true, ...(input.userId ? { id: input.userId } : {}) },
    select: { id: true, preferences: true },
  });
  for (const user of users) {
    const prefs = user.preferences as Record<string, unknown>;
    if (prefs.notifications === false) continue;
    await tx.notification.upsert({
      where: { userId_deduplicationKey: { userId: user.id, deduplicationKey: input.key } },
      update: {},
      create: {
        userId: user.id,
        type: input.type,
        title: input.title,
        body: input.body,
        deduplicationKey: input.key,
        alertId: input.alertId,
        incidentId: input.incidentId,
      },
    });
  }
}
