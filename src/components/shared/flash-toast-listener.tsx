"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { FLASH_COOKIE, type FlashToast } from "@/lib/flash-cookie";
import { toast } from "@/lib/toast";

function takeFlash(): FlashToast | null {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${FLASH_COOKIE}=`));
  if (!entry) return null;

  // Cleared before showing, so a second run of this effect finds nothing and cannot toast twice.
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;

  try {
    return JSON.parse(decodeURIComponent(entry.slice(FLASH_COOKIE.length + 1))) as FlashToast;
  } catch {
    return null;
  }
}

/**
 * Shows a toast queued by a Server Action that redirected. It watches the path because a redirect is a
 * client-side navigation: this component stays mounted, so a mount effect alone would miss it.
 */
export function FlashToastListener() {
  const pathname = usePathname();

  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast[flash.tone](flash.message);
  }, [pathname]);

  return null;
}
