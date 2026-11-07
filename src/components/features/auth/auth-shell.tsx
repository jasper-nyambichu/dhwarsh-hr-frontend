import Link from "next/link";
import type { ReactNode } from "react";

import { DevelopedBy, OrganisationLogo, VendorLogo } from "@/components/shared/organisation-brand";
import { getOrganisationBranding } from "@/lib/api/organisation";
import { cn } from "@/lib/utils";

const PORTALS = [
  { key: "admin", label: "Admin", href: "/login" },
  { key: "branch", label: "Branch", href: "/branch-login" },
  { key: "agent", label: "Agent", href: "/agent-login" },
] as const;

export type PortalKey = (typeof PORTALS)[number]["key"];

/**
 * The one layout all three sign-in pages share (after the design the client chose): a coloured, curved
 * panel carrying DhwarshHub — the company behind the system — and which portal this is; beside it, the
 * organisation's own logo (from Admin → Settings) centred above "Welcome back!" and the form.
 *
 * Phones: the panel becomes a curved band across the top, and the form follows underneath.
 */
export async function AuthShell({
  portal,
  title,
  description,
  children,
}: {
  portal: PortalKey;
  /** e.g. "Admin login". */
  title: string;
  description: string;
  /** The sign-in form. */
  children: ReactNode;
}) {
  const branding = await getOrganisationBranding();

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-amber-main/15 via-surface-bright to-primary/20 font-body-md text-on-surface sm:p-6 lg:p-10">
      <div className="relative flex min-h-dvh w-full max-w-5xl flex-col overflow-hidden bg-surface-container-lowest shadow-2xl sm:min-h-0 sm:rounded-[28px] md:grid md:min-h-[600px] md:grid-cols-[44%_56%]">
        {/* ------------------------------------------------ Brand panel: DhwarshHub + portal */}
        <section className="relative flex flex-col gap-6 overflow-hidden bg-gradient-to-br from-primary via-primary-container to-on-primary-fixed-variant px-6 pb-16 pt-6 text-on-primary sm:px-8 md:gap-0 md:py-10 md:pl-10 md:pr-24">
          <LeafPattern />

          <nav aria-label="Sign-in portals" className="relative z-10 flex flex-wrap gap-1.5">
            {PORTALS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.key === portal ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
                  item.key === portal ? "bg-white text-primary" : "text-white/85 hover:bg-white/15 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-4 md:mt-auto md:flex-col md:items-start md:gap-6">
            {/* DhwarshHub's wordmark is dark, so it sits on a white tile. */}
            <span className="block w-24 shrink-0 rounded-2xl bg-white p-2.5 shadow-lg sm:w-28 md:w-40 md:p-3.5">
              <VendorLogo eager />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80 md:text-sm">My dashboard</p>
              <h1 className="mt-1 text-2xl font-extrabold uppercase leading-tight tracking-wide text-white md:text-4xl">{title}</h1>
              <p className="mt-2 hidden max-w-xs text-sm text-white/80 md:block">{description}</p>
            </div>
          </div>

          <p className="relative z-10 mt-auto hidden pt-10 text-[11px] text-white/70 md:block">
            Developed by <span className="font-semibold text-white">DhwarshHub</span>
          </p>

          {/* The curve between the two halves: down the right edge on wide screens, along the bottom on phones. */}
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-y-0 right-0 hidden h-full w-24 fill-surface-container-lowest md:block">
            <path d="M100 0 H78 C30 30 18 68 0 100 H100 Z" />
          </svg>
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full fill-surface-container-lowest md:hidden">
            <path d="M0 100 V70 C35 10 70 10 100 55 V100 Z" />
          </svg>
        </section>

        {/* ------------------------------------------------ Organisation + form */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-2 sm:px-10 md:px-14 md:py-12">
          <div className="w-full max-w-sm">
            <div className="flex justify-center">
              <OrganisationLogo
                branding={branding}
                className="h-24 w-auto max-w-[280px] rounded-xl sm:h-28"
                nameClassName="text-2xl"
              />
            </div>

            <h2 className="mt-6 text-center text-2xl font-bold uppercase tracking-wide text-on-surface sm:text-[28px]">Welcome back!</h2>
            <p className="mt-1 text-center text-sm text-on-surface-variant">Please login to view your dashboard</p>

            <div className="mt-7">{children}</div>

            <p className="mt-7 text-center text-[11px] leading-relaxed text-outline">
              By signing in you agree to use this system only for {branding.name ?? "your organisation"}&apos;s work. Your
              details are not shared with any third party.
            </p>
            <DevelopedBy className="mt-4 md:hidden" />
          </div>
        </section>
      </div>
    </div>
  );
}

/** Soft leaf shapes behind the panel, after the reference design. Decorative only. */
function LeafPattern() {
  return (
    <svg aria-hidden viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.08]">
      <g fill="currentColor">
        <path d="M60 80 C140 20 220 60 240 140 C160 160 90 140 60 80 Z" />
        <path d="M-20 260 C60 190 150 220 170 300 C90 330 20 310 -20 260 Z" />
        <path d="M200 380 C280 300 380 330 400 420 C310 450 240 440 200 380 Z" />
        <path d="M40 470 C110 420 190 450 200 520 C130 545 70 530 40 470 Z" />
        <path d="M250 200 C320 150 400 180 410 250 C340 270 280 260 250 200 Z" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M60 80 C120 100 180 120 240 140" />
        <path d="M-20 260 C50 270 110 285 170 300" />
        <path d="M200 380 C270 395 340 405 400 420" />
      </g>
    </svg>
  );
}
