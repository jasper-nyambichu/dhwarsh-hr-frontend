import { NextResponse } from "next/server";

import { ApiError } from "@/app/lib/api-error";
import { getMyNotifications, getUnreadCount } from "@/lib/api/notification";
import type { NotificationsPayload } from "@/types/notification";

/**
 * Feed for the notification bell.
 *
 * The bell is a Client Component and cannot call the backend itself — the API
 * client reads the session cookie and carries the JWT, so it is server-only.
 * This route is the one place the browser asks for notifications; it polls here.
 *
 * Always `no-store`: these are per-user and change every few seconds.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [items, unread] = await Promise.all([
      getMyNotifications(),
      getUnreadCount(),
    ]);

    const payload: NotificationsPayload = { items, unread };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const unauthorized = error instanceof ApiError && error.isUnauthorized;

    return NextResponse.json(
      { error: unauthorized ? "Signed out" : "Notifications unavailable" },
      { status: unauthorized ? 401 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}