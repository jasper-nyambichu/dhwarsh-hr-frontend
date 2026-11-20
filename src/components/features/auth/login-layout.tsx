import Link from "next/link";
import type { ReactNode } from "react";

import { DevelopedBy, VendorMark } from "@/components/shared/organisation-brand";
import { Icon } from "@/components/ui/icon";
import type { OrganisationBranding } from "@/lib/api/organisation";
import { cn } from "@/lib/utils";

/** The three sign-in pages. */
export const LOGIN_PORTALS = [
  { id: "admin", href: "/login", label: "Admin login", icon: "admin_panel_settings" },
  { id: "branch", href: "/branch/login", label: "Branch login", icon: "storefront" },
  { id: "agent", href: "/agent/login", label: "Agent login", icon: "badge" },
] as const;

export type LoginPortal = (typeof LOGIN_PORTALS)[number]["id"];

/**
 * Each portal's colours, so the three sign-ins are told apart at a glance: the Admin blue, the Branch Manager green,
 * the agent amber/yellow. The panel is a deep shade of the colour so the Dhwarsh logo's own colours stand out on it;
 * the form uses the accent (focus ring, links, ticks) and the button colour.
 */
export type LoginTheme = {
  panel: string;      // CSS background for the logo panel
  glow: string;       // the soft light behind the logo
  wordmark: string;   // "Employee Management" under the logo
  accent: string;     // focus ring / link colour, as a hex
  button: string;     // classes for the Login button
};

export const LOGIN_THEMES: Record<LoginPortal, LoginTheme> = {
  admin: {
    panel: "radial-gradient(120% 90% at 40% 42%, #1c4499 0%, #0d2766 42%, #06163d 100%)",
    glow: "rgba(96, 150, 255, 0.35)",
    wordmark: "#9be15d",
    accent: "#1849d8",
    button: "bg-[#0f2a6b] hover:bg-[#1849d8] focus-visible:ring-[#1849d8]/40",
  },
  branch: {
    panel: "radial-gradient(120% 90% at 40% 42%, #157a57 0%, #0a4a36 42%, #04241b 100%)",
    glow: "rgba(120, 235, 180, 0.3)",
    wordmark: "#c4f59a",
    accent: "#0f7a55",
    button: "bg-[#0b4f3d] hover:bg-[#0f7a55] focus-visible:ring-[#0f7a55]/40",
  },
  agent: {
    panel: "radial-gradient(120% 90% at 40% 42%, #b27a06 0%, #7a5000 42%, #3b2600 100%)",
    glow: "rgba(255, 220, 120, 0.35)",
    wordmark: "#ffe39a",
    accent: "#b07800",
    button: "bg-[#7a4d00] hover:bg-[#a46a00] focus-visible:ring-[#b07800]/40",
  },
};

const PORTAL_NAMES: Record<LoginPortal, string> = {
  admin: "Admin portal",
  branch: "Branch portal",
  agent: "Agent portal",
};

/**
 * The layout every sign-in page shares (2026-11-20, after the designs the client chose): the screen split in two.
 * Left, a panel in the portal's colour with the Dhwarsh logo large in its centre; right, a white panel with the sign-in
 * form, vertically centred, and below it buttons to the other two sign-ins. On a phone the panel becomes a short band
 * above the form with the logo centred in it. Nothing overlaps at any width.
 */
export function LoginLayout({
  portal,
  branding,
  tagline,
  subtitle,
  children,
}: {
  portal: LoginPortal;
  branding: OrganisationBranding;
  /** A short line under the logo. */
  tagline: string;
  /** Under "Welcome Back to …!". */
  subtitle: string;
  /** The form. */
  children: ReactNode;
}) {
  const theme = LOGIN_THEMES[portal];
  const others = LOGIN_PORTALS.filter((p) => p.id !== portal);
  const organisation = branding.name ?? "Dhwarsh";

  return (
    <main className="flex min-h-dvh w-full flex-col bg-white font-body-md text-on-surface lg:flex-row">
      {/* ---------------------------------------- The logo panel */}
      <section
        className="relative isolate flex shrink-0 flex-col items-center justify-center overflow-hidden px-5 py-8 text-white sm:py-10 lg:min-h-dvh lg:w-[46%] lg:p-10 xl:w-1/2"
        style={{ background: theme.panel }}
      >
        <PanelScene glow={theme.glow} />

        <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm sm:text-xs">
          {PORTAL_NAMES[portal]}
        </span>

        {/* The Dhwarsh logo: the emblem, then the name as text so it stays sharp and readable on the panel. */}
        <div className="mt-4 flex flex-col items-center text-center lg:mt-6">
          <div className="w-28 drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:w-36 lg:w-56 xl:w-64 2xl:w-72">
            <VendorMark eager sizes="(min-width: 1536px) 288px, (min-width: 1024px) 256px, 144px" />
          </div>
          <p className="mt-1 text-[34px] font-extrabold leading-none tracking-tight drop-shadow-md sm:text-5xl lg:mt-2 lg:text-6xl xl:text-7xl">
            Dhwarsh
          </p>
          <p
            className="mt-1.5 text-base font-semibold tracking-wide drop-shadow sm:text-xl lg:mt-3 lg:text-2xl xl:text-[28px]"
            style={{ color: theme.wordmark }}
          >
            Employee Management
          </p>
          <p className="mt-3 hidden max-w-sm text-sm text-white/80 sm:block lg:mt-6 lg:text-base">{tagline}</p>
        </div>

        {/* One dot per sign-in page, this one highlighted. */}
        <nav aria-label="Sign-in pages" className="mt-5 flex items-center gap-2 lg:absolute lg:bottom-10 lg:mt-0">
          {LOGIN_PORTALS.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              aria-label={p.label}
              aria-current={p.id === portal ? "page" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all",
                p.id === portal ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </nav>
      </section>

      {/* ---------------------------------------- The sign-in form */}
      <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:min-h-dvh lg:px-12">
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold tracking-tight text-[#14213d] sm:text-[28px]">
            Welcome Back to <span className="break-words">{organisation}</span>!
          </h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-7 flex items-center gap-3 text-xs text-outline" aria-hidden>
            <span className="h-px flex-1 bg-outline-variant/60" />
            Other sign-in pages
            <span className="h-px flex-1 bg-outline-variant/60" />
          </div>
          <nav aria-label="Other sign-in pages" className="mt-4 grid grid-cols-2 gap-3">
            {others.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant/70 px-3 text-sm font-semibold text-[#14213d] transition-colors hover:border-outline hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Icon name={p.icon} className={cn("text-[20px]", portalIconColour[p.id])} />
                <span className="truncate">{p.label}</span>
              </Link>
            ))}
          </nav>

          <DevelopedBy className="mt-8" />
        </div>
      </section>
    </main>
  );
}

const portalIconColour: Record<LoginPortal, string> = {
  admin: "text-[#1849d8]",
  branch: "text-[#0f7a55]",
  agent: "text-[#b07800]",
};

/** The faint icons floating around the logo, as in the design. Wide screens only, where they clear the logo. */
const BUBBLES = [
  { icon: "groups", className: "right-[6%] top-[6%] size-24 2xl:size-28" },
  { icon: "description", className: "right-[30%] top-[4%] size-16" },
  { icon: "fingerprint", className: "left-[6%] top-[20%] size-14" },
  { icon: "payments", className: "left-[5%] bottom-[9%] size-16" },
  { icon: "calendar_month", className: "right-[5%] bottom-[12%] size-20" },
] as const;

/**
 * The panel's background, after the design: a soft light behind the logo, wide faint rings around it, a dot grid in
 * the corners, faint icon bubbles and a city skyline at the foot. Drawn in CSS/SVG so it is sharp at any size and
 * takes the portal's colour. Decorative only.
 */
function PanelScene({ glow }: { glow: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Light behind the logo */}
      <span
        className="absolute left-1/2 top-1/2 size-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl lg:size-[640px]"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 65%)` }}
      />
      {/* Rings */}
      <span className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] lg:size-[760px]" />
      <span className="absolute left-1/2 top-1/2 size-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] lg:size-[1100px]" />
      {/* Dot grids */}
      <span className="absolute left-0 top-0 h-48 w-56 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(135deg,black,transparent_75%)]" />
      <span className="absolute bottom-0 right-0 h-48 w-56 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(315deg,black,transparent_75%)]" />
      {/* Icon bubbles */}
      {BUBBLES.map((b) => (
        <span
          key={b.icon}
          className={cn(
            "absolute hidden items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/35 xl:flex",
            b.className,
          )}
        >
          <Icon name={b.icon} className="text-[28px] xl:text-[32px]" />
        </span>
      ))}
      {/* Skyline at the foot */}
      <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 hidden h-28 w-full lg:block">
        <path
          d="M0 120 V86 H28 V62 H52 V80 H70 V48 H96 V74 H118 V58 H140 V90 H162 V40 H178 V30 H190 V40 H206 V84 H230 V66 H254 V92 H276 V54 H300 V70 H322 V44 H346 V88 H370 V60 H392 V78 H414 V36 H440 V82 H462 V64 H486 V94 H508 V52 H532 V76 H556 V60 H578 V88 H600 V120 Z"
          fill="#000000"
          fillOpacity="0.22"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}
