import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { VENDOR_NAME, VendorMark } from "@/components/shared/organisation-brand";
import { Icon } from "@/components/ui/icon";
import type { OrganisationBranding } from "@/lib/api/organisation";
import { cn } from "@/lib/utils";

/** The three sign-in pages. */
export const LOGIN_PORTALS = [
  { id: "admin", href: "/login", label: "Admin login", pill: "Admin portal", icon: "shield", pillIcon: "admin_panel_settings" },
  { id: "branch", href: "/branch/login", label: "Branch login", pill: "Branch portal", icon: "storefront", pillIcon: "storefront" },
  { id: "agent", href: "/agent/login", label: "Agent login", pill: "Agent portal", icon: "badge", pillIcon: "badge" },
  // Only where the organisation uses the Accounts Office (Kisiimatt); elsewhere it is never shown.
  { id: "accounts", href: "/accounts/login", label: "Accounts login", pill: "Accounts portal", icon: "account_balance_wallet", pillIcon: "account_balance_wallet" },
] as const;

export type LoginPortal = (typeof LOGIN_PORTALS)[number]["id"];

/**
 * Each portal's colours, so the three sign-ins are told apart at a glance: the Admin blue, the Branch Manager green,
 * the agent amber/yellow. The panel overlay is a deep shade of the colour so the Dhwarsh logo's own colours stand out
 * on it; the form uses the accent (focus ring, links, ticks) and the button colour.
 */
export type LoginTheme = {
  overlay: string;    // CSS radial gradient over the panel's scene
  glow: string;       // the soft light behind the logo
  tint: string;       // "Employee Management" under the logo
  accent: string;     // focus ring / link colour, as a hex
  button: string;     // classes for the Login button
  navIcon: string;    // this portal's icon colour on the other pages' buttons
};

export const LOGIN_THEMES: Record<LoginPortal, LoginTheme> = {
  admin: {
    overlay: "radial-gradient(circle at center, #1C4499 0%, #0D2766 60%, #06163D 100%)",
    glow: "rgba(96, 150, 255, 0.38)",
    tint: "#9BE15D",
    accent: "#1849D8",
    button: "bg-[#0F2A6B] hover:bg-[#1849D8] focus-visible:ring-[#1849D8]/20",
    navIcon: "text-blue-600",
  },
  branch: {
    overlay: "radial-gradient(circle at center, #157A57 0%, #0A4A36 60%, #04241B 100%)",
    glow: "rgba(120, 235, 180, 0.35)",
    tint: "#C4F59A",
    accent: "#0F7A55",
    button: "bg-[#0B4F3D] hover:bg-[#0F7A55] focus-visible:ring-[#0F7A55]/20",
    navIcon: "text-emerald-600",
  },
  agent: {
    overlay: "radial-gradient(circle at center, #B27A06 0%, #7A5000 60%, #3B2600 100%)",
    glow: "rgba(255, 220, 120, 0.40)",
    tint: "#FFE39A",
    accent: "#B07800",
    button: "bg-[#7A4D00] hover:bg-[#A46A00] focus-visible:ring-[#B07800]/20",
    navIcon: "text-amber-500",
  },
  accounts: {
    overlay: "radial-gradient(circle at center, #6D3FC4 0%, #3E1F86 60%, #1E0D47 100%)",
    glow: "rgba(180, 150, 255, 0.38)",
    tint: "#E2D4FF",
    accent: "#6D28D9",
    button: "bg-[#4C1D95] hover:bg-[#6D28D9] focus-visible:ring-[#6D28D9]/20",
    navIcon: "text-violet-600",
  },
};

/**
 * The layout every sign-in page shares, built from the design the client made in Google Stitch (2026-11-23): a
 * rounded card on a light grey page, split in two. Left, a dusk building scene under the portal's colour with the
 * Dhwarsh logo large in its centre and dots to the three sign-ins; right, a white panel with the sign-in form and
 * buttons to the other two sign-ins. On a tablet or phone the panel becomes a band above the form. Nothing overlaps at
 * any width.
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
  // The Accounts login exists only where the organisation uses the Accounts Office.
  const portals = LOGIN_PORTALS.filter((p) => p.id !== "accounts" || branding.accountsOffice || portal === "accounts");
  const current = portals.find((p) => p.id === portal)!;
  const others = portals.filter((p) => p.id !== portal);
  const organisation = branding.name ?? "Dhwarsh";
  const position = portals.findIndex((p) => p.id === portal) + 1;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-slate-100 font-body-md text-slate-800 antialiased sm:p-4 lg:p-6">
      <main className="relative flex w-full max-w-[1440px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl sm:border sm:border-slate-200/80 md:rounded-3xl lg:min-h-[min(820px,calc(100dvh-3rem))] lg:flex-row">
        {/* ---------------------------------------- The logo panel */}
        <section className="relative isolate flex min-h-[300px] w-full flex-col items-center justify-between overflow-hidden p-6 text-white sm:min-h-[340px] sm:p-8 lg:min-h-0 lg:w-[46%] lg:p-12 xl:w-1/2">
          <PanelScene overlay={theme.overlay} />

          {/* The logo group, large and centred. */}
          <div className="relative z-20 my-auto flex flex-col items-center py-4 text-center lg:py-6">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md sm:text-xs">
                <Icon name={current.pillIcon} className="text-[14px] text-white/90" />
                {current.pill}
              </span>
            </div>

            <div className="relative mb-3 flex items-center justify-center sm:mb-4">
              <span
                aria-hidden
                className="pointer-events-none absolute size-24 rounded-full sm:size-32"
                style={{ boxShadow: `0 0 90px 45px ${theme.glow}` } as CSSProperties}
              />
              <div className="relative rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-[2px]">
                <div className="w-24 drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] sm:w-36 md:w-40 lg:w-48 xl:w-56 2xl:w-64">
                  <VendorMark eager sizes="(min-width: 1536px) 256px, (min-width: 1280px) 224px, (min-width: 1024px) 192px, 160px" />
                </div>
              </div>
            </div>

            <p className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl xl:text-6xl">Dhwarsh</p>
            <p className="mt-1 text-sm font-semibold tracking-wide sm:text-base md:text-lg lg:text-xl" style={{ color: theme.tint }}>
              Employee Management
            </p>
            <p className="mt-3 hidden max-w-sm px-4 text-center text-xs leading-relaxed text-white/80 sm:block sm:text-sm">{tagline}</p>
          </div>

          {/* One dot per sign-in page, this one highlighted. */}
          <nav aria-label="Sign-in pages" className="relative z-20 flex flex-col items-center gap-2 pt-2">
            <div className="flex items-center gap-2.5">
              {portals.map((p) =>
                p.id === portal ? (
                  // This page: a wide bar, not a link.
                  <span key={p.id} aria-label={`${p.pill} (this page)`} title={`${p.pill} (active)`} className="h-2 w-8 rounded-full bg-white shadow-sm transition-all duration-300" />
                ) : (
                  <Link
                    key={p.id}
                    href={p.href}
                    aria-label={p.pill}
                    title={p.pill}
                    className="h-2 w-2 rounded-full bg-white/50 transition-all duration-300 hover:bg-white/80"
                  />
                ),
              )}
            </div>
            <span className="text-[11px] font-medium tracking-wide text-white/70">Portal Switcher ({position} of {portals.length})</span>
          </nav>
        </section>

        {/* ---------------------------------------- The sign-in form */}
        <section className="flex w-full flex-col items-center justify-center bg-white p-6 sm:p-10 lg:w-[54%] lg:p-14 xl:w-1/2 xl:p-16">
          <div className="my-auto flex w-full max-w-[400px] flex-col py-2">
            <header className="mb-6">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#14213D] sm:text-[28px]">
                Welcome Back to <span className="break-words">{organisation}</span>!
              </h1>
              <p className="mt-1.5 text-sm text-[#475569]">{subtitle}</p>
            </header>

            {children}

            <div className="relative my-7 flex items-center justify-center" aria-hidden>
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Other sign-in pages
              </span>
            </div>
            <nav aria-label="Other sign-in pages" className="grid grid-cols-2 gap-3">
              {others.map((p, index) => (
                <Link
                  key={p.id}
                  href={p.href}
                  // A third button (where the Accounts login exists) takes the full width under the other two.
                  className={cn(
                    others.length % 2 === 1 && index === others.length - 1 && "col-span-2",
                    "group flex h-11 items-center justify-between gap-1 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-[#94A3B8] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon name={p.icon} className={cn("shrink-0 text-[18px]", LOGIN_THEMES[p.id].navIcon)} />
                    <span className="truncate">{p.label}</span>
                  </span>
                  <Icon name="arrow_forward" className="shrink-0 text-[16px] text-slate-400 transition-transform duration-200 group-hover:translate-x-[3px]" />
                </Link>
              ))}
            </nav>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <span>Developed by</span>
              <span className="inline-block size-4 opacity-80">
                <VendorMark />
              </span>
              <span className="font-semibold text-slate-600">{VENDOR_NAME}</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/** Small icons floating in the panel's corners, as in the design. Wide screens only. */
const BUBBLES = [
  { icon: "groups", className: "right-12 top-12 size-11", iconSize: "text-[20px]" },
  { icon: "description", className: "left-12 top-36 size-10", iconSize: "text-[18px]" },
  { icon: "fingerprint", className: "bottom-28 left-12 size-10", iconSize: "text-[18px]" },
  { icon: "payments", className: "bottom-24 right-16 size-11", iconSize: "text-[20px]" },
] as const;

/**
 * The panel's background, after the design: a building with a sweeping curved roof over water at dusk (drawn, so it
 * is sharp at any size), the portal's colour over it, a darker foot, and on wide screens rings around the logo, dot
 * grids and small icon bubbles in the corners. Decorative only.
 */
function PanelScene({ overlay }: { overlay: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full scale-105 bg-[#1b2433]">
        <defs>
          <linearGradient id="login-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6f8fb8" />
            <stop offset="0.55" stopColor="#c9a46b" />
            <stop offset="1" stopColor="#2a2f3a" />
          </linearGradient>
          <linearGradient id="login-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd28a" />
            <stop offset="1" stopColor="#c27a2c" />
          </linearGradient>
        </defs>
        <rect width="600" height="800" fill="url(#login-sky)" />
        {/* Sweeping roof */}
        <g fill="none" stroke="#f4d7a1" strokeLinecap="round">
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M -40 ${330 + i * 8} C 120 ${250 + i * 7}, 300 ${235 + i * 6}, 640 ${300 + i * 10}`} strokeOpacity={0.55 - i * 0.04} strokeWidth={i === 0 ? 4 : 2} />
          ))}
        </g>
        {/* Lit glass hall */}
        <path d="M 40 395 C 200 345, 380 340, 600 385 L 600 560 L 40 560 Z" fill="url(#login-glass)" fillOpacity="0.75" />
        <g stroke="#3a2a18" strokeOpacity="0.45" strokeWidth="2">
          {Array.from({ length: 15 }, (_, i) => (
            <line key={i} x1={60 + i * 37} y1={378 - Math.sin((i / 14) * Math.PI) * 26} x2={60 + i * 37} y2={560} />
          ))}
        </g>
        <path d="M 40 470 L 600 470" stroke="#3a2a18" strokeOpacity="0.4" strokeWidth="2" />
        {/* Water and reflections */}
        <rect x="0" y="560" width="600" height="240" fill="#1d2230" />
        <g stroke="#ffcf8a" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={70 + ((i * 53) % 480)} y1={585 + i * 16} x2={140 + ((i * 53) % 480)} y2={585 + i * 16} strokeOpacity={0.35 - i * 0.02} strokeWidth="3" />
          ))}
        </g>
      </svg>

      {/* The portal's colour, then depth top and bottom */}
      <div className="absolute inset-0 opacity-90" style={{ background: overlay }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Wide-screen accents */}
      <div className="absolute inset-0 hidden overflow-hidden xl:block">
        <span className="absolute left-8 top-8 size-32 rounded-lg opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.2)_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
        <span className="absolute bottom-12 right-8 size-32 rounded-lg opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.2)_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
        <span className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]" />
        <span className="absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] opacity-60" />
        <span className="absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] opacity-30" />
        {BUBBLES.map((b) => (
          <span
            key={b.icon}
            className={cn(
              "absolute flex items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 shadow-sm backdrop-blur-md",
              b.className,
            )}
          >
            <Icon name={b.icon} className={b.iconSize} />
          </span>
        ))}
      </div>
    </div>
  );
}
