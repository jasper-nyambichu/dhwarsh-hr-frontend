import type { ReactNode } from "react";

/**
 * Auth route group.
 *
 * Each login surface ships its own full-bleed layout from Stitch — staff and
 * agent are split panels, employee is a centered card. So this is a
 * passthrough; the chrome lives in each page.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
