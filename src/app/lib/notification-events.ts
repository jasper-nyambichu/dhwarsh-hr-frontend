/**
 * The bell polls every 30 seconds, which is too slow right after the user does
 * something that changes their own notifications — an admin approving a request
 * should see that request's notification vanish immediately, not half a minute
 * later. Anything that does that calls `refreshNotifications()`; the bell
 * listens for the event and re-fetches at once.
 */
export const NOTIFICATIONS_REFRESH_EVENT = "notifications:refresh";

export function refreshNotifications(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }
}