"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Application toaster.
 *
 * Wraps sonner so the placement and theming live in one place rather than being
 * re-passed at every mount point.
 *
 * Placement is top-right at every width. The offset clears the sticky top bar
 * (h-16 on mobile, h-20 from `sm`) so a toast never lands on top of the
 * notification bell and profile avatar — the controls a user is most likely to
 * be reaching for when one appears.
 *
 * Below 600px sonner switches toasts to full-width of its container on its own,
 * so `mobileOffset` only needs to keep them off the top bar and away from the
 * screen edges.
 *
 * `closeButton` matters more than usual here: several toasts report the outcome
 * of a payroll or approval action, and a user who wants to re-read one should
 * not have to race the timeout.
 */
export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      duration={4500}
      offset={{ top: "88px", right: "16px" }}
      mobileOffset={{ top: "72px", right: "12px", left: "12px" }}
      toastOptions={{ classNames: TOAST_CLASSNAMES }}
    />
  );
}

/**
 * Sonner's own palette is kept for the status variants (richColors) — only the
 * shell is restyled, so success/error/warning stay visually distinct instead of
 * collapsing into one brand colour.
 */
const TOAST_CLASSNAMES = {
  toast:
    "!rounded-card !border !border-outline-variant/40 !font-body-md !shadow-ambient-2",
  title: "!text-sm !font-semibold",
  description: "!text-body-md !text-on-surface-variant",
  actionButton: "!rounded-lg !bg-primary !text-on-primary !text-xs !font-semibold",
  cancelButton:
    "!rounded-lg !bg-surface-container !text-on-surface-variant !text-xs !font-semibold",
  closeButton: "!border-outline-variant/40",
};
