import { can, type Capability } from "./permissions";
import { AppError } from "@/server/errors";
import type { Prisma } from "@/generated/prisma/client";
import type { Actor } from "./guard";
export async function authorizeTransaction(
  tx: Prisma.TransactionClient,
  actor: Actor,
  capability: Capability,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`actor:${actor.id}`}))`;
  const current = await tx.user.findUnique({ where: { id: actor.id } });
  if (
    !current?.isActive ||
    current.sessionVersion !== actor.sessionVersion ||
    !can(current.role, capability)
  )
    throw new AppError("FORBIDDEN", "Permission changed. Sign in again.", 403);
  return current;
}
