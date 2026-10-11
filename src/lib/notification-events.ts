/**
 * A named CustomEvent that Server Action wrappers dispatch after a decision
 * (approve / reject) so the NotificationBell re-fetches immediately rather
 * than waiting for the next 30-second poll.
 *
 * Only dispatched in the browser — the constant is also imported by the bell
 * to register its listener, so both sides use the same string.
 */
export const NOTIFICATIONS_REFRESH_EVENT = "notifications:refresh";

/** Dispatch the refresh event. No-op outside the browser. */
export function refreshNotifications(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }
}
