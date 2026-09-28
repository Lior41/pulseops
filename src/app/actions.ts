"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireActor, type Actor } from "@/server/auth/guard";
import type { Capability } from "@/server/auth/permissions";
import { AppError } from "@/server/errors";
import {
  updateAlert,
  createIncident,
  updateIncident,
  addComment,
} from "@/server/services/investigations";
import { analyzeAlert } from "@/server/ai/analyze";
import { savePreferences, changeRole, saveOrganization } from "@/server/services/settings";
async function perform<T>(
  capability: Capability,
  fn: (actor: Actor) => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const actor = await requireActor(capability);
    const data = await fn(actor);
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message };
    if (e instanceof ZodError)
      return { ok: false, error: e.issues[0]?.message ?? "Invalid request." };
    console.error("Action failed", e instanceof Error ? e.name : "unknown");
    return { ok: false, error: "Unable to complete this action. Please try again." };
  }
}
export async function updateAlertAction(input: unknown) {
  return perform("investigate", (actor) => updateAlert(actor, input));
}
export async function createIncidentAction(input: unknown) {
  return perform("investigate", (actor) => createIncident(actor, input));
}
export async function updateIncidentAction(input: unknown) {
  return perform("investigate", (actor) => updateIncident(actor, input));
}
export async function addCommentAction(input: unknown) {
  return perform("investigate", (actor) => addComment(actor, input));
}
export async function analyzeAction(input: unknown) {
  return perform("analyze", (actor) => analyzeAlert(actor, input));
}
export async function preferencesAction(input: unknown) {
  return perform("read", (actor) => savePreferences(actor, input));
}
export async function roleAction(input: unknown) {
  return perform("admin", (actor) => changeRole(actor, input));
}
export async function organizationAction(input: unknown) {
  return perform("admin", (actor) => saveOrganization(actor, input));
}
