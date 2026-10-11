"use server";

import { toActionError } from "@/app/lib/api-error";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/api/notification";

/**
 * Server Actions for the notification bell.
 *
 * These are thin wrappers — the bell is a Client Component and cannot call
 * the server-only api-client directly, so it goes through Server Actions.
 *
 * Both return `{ ok: boolean }` rather than a full `ActionState` because the
 * bell handles failures itself (re-fetches the list) and does not need field
 * errors or a toast.
 */

export async function markNotificationReadAction(
  id: number,
): Promise<{ ok: boolean }> {
  try {
    await markNotificationRead(id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  try {
    await markAllNotificationsRead();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
