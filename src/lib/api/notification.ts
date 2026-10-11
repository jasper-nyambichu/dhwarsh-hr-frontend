import "server-only";

import { api } from "@/app/lib/api-client";
import type { NotificationResponse } from "@/types/notification";

/**
 * `controller/notification/NotificationController` — base `/notifications`.
 *
 * Every endpoint acts on the caller's own notifications only (the backend
 * resolves the user from the token), so any signed-in role may call them.
 *
 *   GET  /notifications              the caller's 50 latest, newest first
 *   GET  /notifications/unread-count
 *   PUT  /notifications/{id}/read    404 for someone else's notification
 *   PUT  /notifications/read-all
 */

export function getMyNotifications(
  signal?: AbortSignal,
): Promise<NotificationResponse[]> {
  return api.get<NotificationResponse[]>("/notifications", { signal });
}

export function getUnreadCount(signal?: AbortSignal): Promise<number> {
  return api.get<number>("/notifications/unread-count", { signal });
}

export function markNotificationRead(id: number): Promise<void> {
  return api.put<void>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<void> {
  return api.put<void>("/notifications/read-all");
}