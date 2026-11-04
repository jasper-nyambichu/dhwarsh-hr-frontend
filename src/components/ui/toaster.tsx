"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Application toaster.
 *
 * Wraps sonner so the placement lives in one place rather than being re-passed at
 * every mount point. The card itself and how long each kind stays are in
 * `lib/toast.tsx`.
 *
 * Placement is top-right at every width. The offset clears the sticky top bar
 * (h-16 on mobile, h-20 from `sm`) so a toast never lands on top of the
 * notification bell and profile avatar — the controls a user is most likely to
 * be reaching for when one appears.
 *
 * `expand` lists several toasts one under the other instead of stacking them
 * behind each other, so none is hidden while it is on screen.
 */
export function Toaster() {
  return (
    <Sonner
      expand
      position="top-right"
      visibleToasts={4}
      gap={12}
      offset={{ top: "88px", right: "16px" }}
      mobileOffset={{ top: "72px", right: "12px", left: "12px" }}
    />
  );
}
