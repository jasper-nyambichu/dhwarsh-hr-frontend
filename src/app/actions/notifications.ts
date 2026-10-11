"use server";

import { verifySession } from "@/app/lib/dal";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notification";

/**
 * Bell actions. The backend scopes both to the caller, so the only thing to
 * check here is that there is a session at all.
 *
 * They return a plain `{ ok }` rather than an ActionState: the bell updates its
 * own list optimistically and only needs to know whether to roll back.
 */

export async function markNotificationReadAction(
  id: number,
): Promise<{ ok: boolean }> {
  await verifySession();

  if (!Number.isInteger(id) || id <= 0) return { ok: false };

  try {
    await markNotificationRead(id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  await verifySession();

  try {
    await markAllNotificationsRead();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}