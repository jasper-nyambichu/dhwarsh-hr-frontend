import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { branchLogin } from "@/app/actions/auth";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { BrandLockup } from "@/components/shared/brand-logo";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Branch Login" };

const POINTS = [
  { icon: "schedule", title: "Today's attendance", text: "See who is on site at your branch." },
  { icon: "event_busy", title: "Off list", text: "Everyone given days off this month." },
  { icon: "group", title: "Your employees", text: "Your branch's team in one place." },
];

/** The Branch Managers' own door: a centred card over the branch's day, unlike the Admin and Agent split screens. */
export default function BranchLoginPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-8 bg-surface-container-low p-4 font-body-md text-on-surface sm:p-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-card bg-surface-container-lowest shadow-ambient-1 md:grid md:grid-cols-5">
        <section className="flex flex-col gap-6 bg-tertiary-container/10 p-6 sm:p-8 md:col-span-2">
          <span className="flex w-fit items-center gap-2 rounded-full bg-tertiary-container/20 px-3 py-1 text-xs font-bold text-tertiary">
            <Icon name="location_city" className="text-[16px]" />
            Branch Portal
          </span>
          <h1 className="text-2xl font-bold leading-tight text-on-surface">Run your branch, day by day.</h1>
          <ul className="hidden flex-col gap-4 md:flex">
            {POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-tertiary">
                  <Icon name={point.icon} className="text-[20px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{point.title}</span>
                  <span className="block text-xs text-on-surface-variant">{point.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-6 sm:p-8 md:col-span-3">
          <BrandLockup eager sizes="112px" className="mb-5 w-28 max-w-full" />
          <h2 className="mb-1 font-display-greeting text-display-greeting text-on-surface">Branch Manager sign in</h2>
          <p className="mb-6 font-body-md text-body-md text-on-surface-variant">Use the login your Admin gave you.</p>
          {/* useSearchParams needs a Suspense boundary during prerender. */}
          <Suspense fallback={<div className="h-[360px]" />}>
            <StaffLoginForm action={branchLogin} forgotHref="/forgot-password?from=branch" />
          </Suspense>
        </section>
      </div>

      <nav aria-label="Other logins" className="flex gap-6 text-xs font-medium text-on-surface-variant">
        <Link href="/login" className="hover:text-primary">Admin login</Link>
        <Link href="/agent-login" className="hover:text-primary">Agent Portal</Link>
      </nav>
    </div>
  );
}
