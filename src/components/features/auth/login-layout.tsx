import Link from "next/link";
import type { ReactNode } from "react";

import { DevelopedBy, VendorLogo } from "@/components/shared/organisation-brand";
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
 * the agent amber/yellow. The picture panel uses the gradient; the form uses the accent (focus ring, links, ticks)
 * and the button colour.
 */
export type LoginTheme = {
  panel: string;      // Tailwind gradient for the picture panel
  glow: string;       // a soft light in the panel's corner
  accent: string;     // focus ring / link colour, as a hex
  button: string;     // classes for the Login button
  dot: string;        // the current portal's dot
};

export const LOGIN_THEMES: Record<LoginPortal, LoginTheme> = {
  admin: {
    panel: "from-[#0a1f52] via-[#1849d8] to-[#4f86f7]",
    glow: "bg-[#8fb3ff]",
    accent: "#1849d8",
    button: "bg-[#0f2a6b] hover:bg-[#1849d8] focus-visible:ring-[#1849d8]/40",
    dot: "bg-[#1849d8]",
  },
  branch: {
    panel: "from-[#06281d] via-[#0f6b4c] to-[#22a06b]",
    glow: "bg-[#8ff0c4]",
    accent: "#0f7a55",
    button: "bg-[#0b4f3d] hover:bg-[#0f7a55] focus-visible:ring-[#0f7a55]/40",
    dot: "bg-[#0f7a55]",
  },
  agent: {
    panel: "from-[#5a3700] via-[#c08400] to-[#f5c234]",
    glow: "bg-[#ffe9a3]",
    accent: "#b07800",
    button: "bg-[#7a4d00] hover:bg-[#a46a00] focus-visible:ring-[#b07800]/40",
    dot: "bg-[#c08400]",
  },
};

/**
 * The layout every sign-in page shares, after the design the client chose (2026-11-20): the screen split in two.
 * Left, a picture panel in the portal's colour with our logo at the top and a headline at the bottom; right, a white
 * panel with the sign-in form, vertically centred, and below it buttons to the other two sign-ins. On a phone the
 * picture becomes a short band above the form. Nothing overlaps at any width.
 */
export function LoginLayout({
  portal,
  branding,
  headline,
  tagline,
  subtitle,
  children,
}: {
  portal: LoginPortal;
  branding: OrganisationBranding;
  /** Large text at the foot of the picture panel. */
  headline: string;
  /** The line under it. */
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
      {/* ---------------------------------------- The picture panel */}
      <section
        className={cn(
          "relative isolate flex min-h-[230px] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br p-5 text-white sm:min-h-[270px] sm:p-8",
          "lg:min-h-dvh lg:w-[46%] lg:p-10 xl:w-1/2 xl:p-12",
          theme.panel,
        )}
      >
        <PanelScene glow={theme.glow} />

        {/* Our logo, on a white tile so its colours stay true on any panel colour. */}
        <div className="flex items-center gap-3">
          <span className="block w-14 shrink-0 rounded-2xl bg-white p-1.5 shadow-lg shadow-black/25 sm:w-16 lg:w-20 xl:w-24">
            <VendorLogo eager sizes="96px" />
          </span>
          <span className="min-w-0 leading-tight drop-shadow">
            <span className="block text-base font-bold tracking-tight sm:text-lg">Dhwarsh</span>
            <span className="block text-xs text-white/85 sm:text-sm">Employee Management</span>
          </span>
        </div>

        <div className="mt-6 max-w-md drop-shadow-md">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{headline}</h1>
          <p className="mt-2 text-sm text-white/90 sm:text-base">{tagline}</p>
          {/* One dot per sign-in page, this one highlighted. */}
          <nav aria-label="Sign-in pages" className="mt-5 flex items-center gap-2">
            {LOGIN_PORTALS.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                aria-label={p.label}
                aria-current={p.id === portal ? "page" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  p.id === portal ? "w-8 bg-white" : "w-2 bg-white/55 hover:bg-white/80",
                )}
              />
            ))}
          </nav>
        </div>
      </section>

      {/* ---------------------------------------- The sign-in form */}
      <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:min-h-dvh lg:px-12">
        <div className="w-full max-w-[400px]">
          <h2 className="text-2xl font-bold tracking-tight text-[#14213d] sm:text-[28px]">
            Welcome Back to <span className="break-words">{organisation}</span>!
          </h2>
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

/**
 * The picture: a modern building with a sweeping curved roof over water at dusk, after the design, drawn in SVG so
 * it is sharp at any size and takes the portal's colour. A dark shade at the foot keeps the headline readable.
 * Decorative only.
 */
function PanelScene({ glow }: { glow: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <span className={cn("absolute -right-24 -top-24 size-80 rounded-full opacity-40 blur-3xl", glow)} />
      <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* Sweeping roof lines */}
        <g fill="none" stroke="#ffffff" strokeLinecap="round">
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M -40 ${330 + i * 9} C 120 ${250 + i * 8}, 300 ${235 + i * 7}, 640 ${300 + i * 11}`}
              strokeOpacity={0.22 - i * 0.015}
              strokeWidth={i === 0 ? 3 : 1.4}
            />
          ))}
        </g>
        {/* The glass hall under the roof, its windows lit */}
        <path d="M 40 395 C 200 345, 380 340, 600 385 L 600 560 L 40 560 Z" fill="#ffffff" fillOpacity="0.1" />
        <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1">
          {Array.from({ length: 15 }, (_, i) => (
            <line key={i} x1={60 + i * 37} y1={378 - Math.sin((i / 14) * Math.PI) * 26} x2={60 + i * 37} y2={560} />
          ))}
        </g>
        <path d="M 40 470 L 600 470" stroke="#ffffff" strokeOpacity="0.14" />
        {/* Water and its reflections */}
        <rect x="0" y="560" width="600" height="240" fill="#000000" fillOpacity="0.12" />
        <g stroke="#ffffff" strokeLinecap="round">
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={70 + ((i * 53) % 480)} y1={590 + i * 18} x2={130 + ((i * 53) % 480)} y2={590 + i * 18} strokeOpacity={0.16} strokeWidth="2" />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
    </div>
  );
}
