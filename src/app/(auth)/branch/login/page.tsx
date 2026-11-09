import type { Metadata } from "next";
import { Suspense } from "react";

import { branchLogin } from "@/app/actions/auth";
import { GlassBackdrop } from "@/components/features/auth/glass-backdrop";
import { StaffLoginForm, type LoginFormTheme } from "@/components/features/auth/staff-login-form";
import { DevelopedBy, OrganisationBadge, VendorLogo } from "@/components/shared/organisation-brand";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Branch Login" };

/** Branch portal theme: deep forest into emerald. */
const THEME: LoginFormTheme = {
  focus: "focus:border-[#139a72] focus:ring-[#139a72]/15",
  link: "text-[#0f7a5a] hover:text-[#0b4f3d]",
  checkbox: "text-[#139a72] focus:ring-[#139a72]/30",
  button: "bg-[#0b4f3d] shadow-[#0b4f3d]/30 hover:bg-[#0f6650]",
};

/**
 * The Branch Manager's sign-in, its own page and theme.
 *
 * Phones follow the Google Stitch design the client approved: a 310px picture band (DhwarshHub tile, portal
 * pill, headline) and the sign-in card overlapping it, with the organisation's logo in a circle on top.
 * Desktops show the Dhwarsh logo large and centred on the picture side, with the card on the right.
 */
export default async function BranchLoginPage() {
  const branding = await getOrganisationBranding();
  const organisation = branding.name ?? "your organisation";

  return (
    <main className="flex min-h-dvh w-full bg-[#f0f3ff] font-body-md text-on-surface lg:p-6">
      <div className="relative isolate flex w-full flex-col overflow-hidden pb-8 lg:min-h-[calc(100dvh-3rem)] lg:flex-row lg:rounded-[28px] lg:pb-0 lg:shadow-2xl">
        {/* The picture fills the band on phones and the whole frame on desktops. */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[310px] lg:inset-0 lg:h-auto">
          <GlassBackdrop gradient="from-[#03231c] via-[#0b4f3d] to-[#139a72]" />
        </div>

        {/* ---------------------------------------- Picture side */}
        <section className="flex h-[310px] flex-col justify-between px-4 pb-[120px] pt-4 text-white sm:px-8 lg:h-auto lg:flex-1 lg:p-10">
          <header className="flex items-center justify-between gap-3">
            {/* Phones: the DhwarshHub tile and name. On desktops the logo is centred below instead. */}
            <span className="flex min-w-0 items-center gap-3 lg:hidden">
              <span className="block size-12 shrink-0 rounded-xl bg-white p-1.5 shadow-md shadow-black/30">
                <VendorLogo eager />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-base font-bold tracking-tight">DhwarshHub</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/75">Employee Management</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 shadow-sm backdrop-blur-md">
              <span className="size-1.5 animate-pulse rounded-full bg-[#c8eade]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Branch Portal</span>
            </span>
          </header>

          {/* Phones: the headline. */}
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-tight drop-shadow-sm lg:hidden">
            Run your branch,
            <br />
            <span className="text-[#c8eade]">day by day.</span>
          </h1>

          {/* Desktops: the Dhwarsh logo, large and centred, on a soft glow so its colours stay clear. */}
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="relative flex w-full max-w-[380px] flex-col items-center">
              <span aria-hidden className="absolute inset-[-14%] rounded-full bg-white/20 blur-3xl" />
              <VendorLogo eager sizes="380px" className="relative drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
          <p className="hidden text-center text-sm text-white/70 lg:block">Today&apos;s attendance, your team and their days off.</p>
        </section>

        {/* ---------------------------------------- The sign-in card */}
        <section className="relative z-10 -mt-14 flex justify-center px-4 lg:mt-0 lg:w-[480px] lg:items-center lg:px-10 xl:w-[520px]">
          <div className="relative w-full max-w-md rounded-[24px] bg-white px-6 pb-7 pt-16 shadow-2xl shadow-black/20 sm:px-9 lg:pb-9">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <span className="relative block">
                <OrganisationBadge branding={branding} className="size-24 sm:size-28" ringClassName="ring-[#139a72]/25" />
                {/* The live dot from the design: this portal is up and reachable. */}
                <span aria-hidden className="absolute bottom-1 right-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-[#139a72]">
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
              </span>
            </div>

            <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-on-surface sm:text-[28px]">Welcome Back!</h2>
            <p className="mt-1 text-center text-xs font-medium text-on-surface-variant sm:text-sm">Log in to manage your {organisation} branch.</p>

            <div className="mt-6">
              {/* useSearchParams needs a Suspense boundary during prerender. */}
              <Suspense fallback={<div className="h-[300px]" />}>
                <StaffLoginForm action={branchLogin} forgotHref="/forgot-password?from=branch" theme={THEME} submitLabel="Log In" />
              </Suspense>
            </div>

            <div className="mt-6 border-t border-outline-variant/30 pt-4">
              <DevelopedBy />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
