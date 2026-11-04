import "server-only";

import { cookies } from "next/headers";

import { FLASH_COOKIE, type FlashToast } from "@/lib/flash-cookie";

/**
 * Queues a toast for the page a Server Action is about to redirect to. A redirect leaves the form behind,
 * so the form cannot announce the result itself. `FlashToastListener` shows it once and clears it.
 */
export async function flashToast(tone: FlashToast["tone"], message: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(FLASH_COOKIE, JSON.stringify({ tone, message } satisfies FlashToast), {
    // The browser has to read and clear it. It only ever holds the wording of a toast.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30,
  });
}
