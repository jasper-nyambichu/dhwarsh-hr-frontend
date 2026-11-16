import Link from "next/link";
import type { ReactNode } from "react";

import { DevelopedBy, OrganisationBadge, VendorLogo } from "@/components/shared/organisation-brand";
import { Icon } from "@/components/ui/icon";
import type { OrganisationBranding } from "@/lib/api/organisation";

/** The three sign-in pages, in the order the arrows under the card walk through them. */
export const LOGIN_PORTALS = [
  { id: "admin", href: "/login", label: "Admin login" },
  { id: "branch", href: "/branch/login", label: "Branch login" },
  { id: "agent", href: "/agent/login", label: "Agent login" },
] as const;

export type LoginPortal = (typeof LOGIN_PORTALS)[number]["id"];

/**
 * The layout every sign-in page shares, after the design the client chose (2026-11-16): a light page with soft
 * circles in two corners, a blue panel on the left carrying the Dhwarsh logo, and the white login card on the right,
 * overlapping the panel's edge. Under the card, arrows lead to the other two sign-in pages.
 *
 * Phones stack the same pieces: a shorter blue panel on top and the card overlapping its foot.
 */
export function LoginLayout({
  portal,
  branding,
  title,
  subtitle,
  panelText,
  children,
}: {
  portal: LoginPortal;
  branding: OrganisationBranding;
  /** The card's heading, e.g. "Admin login". */
  title: string;
  subtitle: string;
  /** The line under "Welcome!" on the blue panel. */
  panelText: string;
  /** The form. */
  children: ReactNode;
}) {
  const index = LOGIN_PORTALS.findIndex((p) => p.id === portal);
  const previous = LOGIN_PORTALS[(index + LOGIN_PORTALS.length - 1) % LOGIN_PORTALS.length];
  const next = LOGIN_PORTALS[(index + 1) % LOGIN_PORTALS.length];
  const portalName = LOGIN_PORTALS[index].label.replace(" login", " portal");

  return (
    <main className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#eef1f7] px-4 py-8 font-body-md text-on-surface sm:px-6 lg:py-12">
      {/* The two corner circles from the design. */}
      <span aria-hidden className="absolute -left-24 -top-24 -z-10 size-56 rounded-full bg-gradient-to-br from-[#5a3fd8] to-[#2346d0] sm:size-72" />
      {/* Phones: only the top circle, so nothing sits behind the arrows and the credit at the foot. */}
      <span aria-hidden className="absolute -bottom-28 -right-24 -z-10 hidden size-80 rounded-full bg-gradient-to-tl from-[#4b2fc8] to-[#2f5fe8] lg:block" />

      <div className="flex w-full max-w-[1040px] flex-col lg:flex-row lg:items-center">
        {/* ---------------------------------------- The blue panel with the Dhwarsh logo */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2f6cf5] via-[#1849d8] to-[#0c2c9e] px-6 pb-16 pt-8 text-center text-white shadow-xl shadow-[#1849d8]/25 lg:min-h-[600px] lg:flex-1 lg:rounded-r-none lg:px-12 lg:pb-12 lg:pr-24 lg:pt-12">
          <PanelWaves />
          <div className="relative flex h-full flex-col items-center justify-center gap-5 lg:gap-7">
            <span className="block w-[150px] rounded-3xl bg-white p-4 shadow-xl shadow-black/25 sm:w-[180px] lg:w-[230px] lg:p-5">
              <VendorLogo eager sizes="230px" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">Welcome!</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-white/85 sm:text-base">{panelText}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-5 py-2 text-[11px] font-bold uppercase tracking-widest shadow-sm ring-1 ring-white/25 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-[#9ff0c9]" />
              {portalName}
            </span>
          </div>
        </section>

        {/* ---------------------------------------- The login card, overlapping the panel, and the arrows under it */}
        <div className="relative z-10 -mt-10 flex w-full flex-col px-2 sm:px-6 lg:-ml-16 lg:mt-0 lg:w-[440px] lg:shrink-0 lg:px-0">
          <section className="rounded-xl bg-white px-6 pb-8 pt-7 shadow-[0_24px_60px_-20px_rgba(15,35,95,0.35)] sm:px-10 sm:pb-10">
            <div className="flex justify-center">
              <OrganisationBadge branding={branding} className="size-16" ringClassName="ring-[#1849d8]/15" />
            </div>
            <h2 className="mx-auto mt-4 w-fit border-b-2 border-[#1849d8] pb-1 text-center text-xl font-bold tracking-tight text-[#14213d]">{title}</h2>
            <p className="mt-3 text-center text-sm text-on-surface-variant">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </section>

          {/* Only the card overlaps the panel: the arrows and the credit start at its edge, on the light page. */}
          <nav aria-label="Other sign-in pages" className="mt-5 flex items-center justify-between gap-3 px-1 lg:ml-20">

            <ArrowLink href={previous.href} label={previous.label} direction="back" />
            <ArrowLink href={next.href} label={next.label} direction="forward" />
          </nav>

          <DevelopedBy className="mt-6 lg:ml-16" />
        </div>
      </div>
    </main>
  );
}

function ArrowLink({ href, label, direction }: { href: string; label: string; direction: "back" | "forward" }) {
  const arrow = (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1849d8] shadow-md shadow-[#1849d8]/15 ring-1 ring-[#1849d8]/15 transition-colors group-hover:bg-[#1849d8] group-hover:text-white">
      <Icon name={direction === "back" ? "arrow_back" : "arrow_forward"} className="text-[20px]" />
    </span>
  );
  return (
    <Link
      href={href}
      aria-label={`Go to ${label}`}
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-full text-sm font-semibold text-[#14213d] transition-colors hover:text-[#1849d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1849d8]/40"
    >
      {direction === "back" ? arrow : null}
      <span>{label}</span>
      {direction === "forward" ? arrow : null}
    </Link>
  );
}

/** The soft waves across the blue panel, as in the design. Decorative only. */
function PanelWaves() {
  return (
    <svg aria-hidden viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <path d="M0 120 C 140 60 220 220 360 170 S 560 40 600 90 L600 0 L0 0 Z" fill="#ffffff" opacity="0.07" />
      <path d="M0 330 C 120 260 260 420 400 340 S 560 230 600 270 L600 0 L0 0 Z" fill="#ffffff" opacity="0.05" />
      <path d="M0 560 C 150 470 250 640 420 560 S 560 470 600 500 L600 700 L0 700 Z" fill="#ffffff" opacity="0.08" />
      <path d="M0 640 C 160 590 300 700 600 610 L600 700 L0 700 Z" fill="#06155a" opacity="0.18" />
      <circle cx="520" cy="420" r="120" fill="#ffffff" opacity="0.05" />
      <circle cx="70" cy="470" r="70" fill="#ffffff" opacity="0.05" />
    </svg>
  );
}
