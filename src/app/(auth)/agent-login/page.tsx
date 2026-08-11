import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { BrandMark } from "@/components/shared/brand-logo";
import { AgentLoginForm } from "@/components/features/auth/agent-login-form";

export const metadata: Metadata = {
  title: "Agent Portal Login",
};

/**
 * Agent portal sign-in. Entry point for the AGENT role, which lands in the
 * /agent namespace.
 *
 * Agents are a distinct principal — external suppliers of outsourced staff
 * (employees.agent_id), billed via service charge and VAT rather than payroll.
 * Hence the separate door and the orange brand treatment.
 */
export default function AgentLoginPage() {
  return (
    <div className="flex min-h-dvh w-full bg-background font-body-md text-on-surface">
      <main className="flex min-h-dvh w-full flex-col md:flex-row">
        {/* ------------------------------------------- LEFT: brand panel */}
        <section className="bg-orange-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-on-primary md:flex md:w-[45%] lg:w-[40%]">
          <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[120%] w-[120%] opacity-20">
            <svg
              className="h-full w-full fill-current"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" fill="none" opacity="0.5" r="40" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="50" fill="none" opacity="0.4" r="30" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="50" fill="none" opacity="0.3" r="20" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <BrandMark
              eager
              sizes="40px"
              className="size-10 rounded-xl shadow-sm ring-1 ring-white/30"
            />
            <div>
              <h1 className="font-page-title text-page-title leading-tight text-white">
                Dhwarsh
              </h1>
              <p className="font-label-rail text-label-rail uppercase tracking-widest text-white/80">
                HR Portal
              </p>
            </div>
          </div>

          <div className="relative z-10 mb-12">
            <span className="glass-panel mb-6 inline-block rounded-full border-white/40 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
              Agent Portal
            </span>
            <h2 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
              Manage your
              <br />
              supplied
              <br />
              workforce.
            </h2>
            <p className="max-w-sm font-body-md text-body-md text-white/80">
              Access real-time attendance, deployment schedules, and performance
              metrics for all personnel assigned through your agency.
            </p>
          </div>

          <div className="glass-panel relative z-10 mt-auto flex h-[180px] w-full max-w-[280px] flex-col justify-end rounded-2xl p-6">
            <div className="mb-4 flex h-24 items-end gap-2">
              <div className="h-[40%] w-full rounded-t-sm bg-white/30" />
              <div className="h-[70%] w-full rounded-t-sm bg-white/50" />
              <div className="h-full w-full rounded-t-sm bg-white/80" />
              <div className="h-[60%] w-full rounded-t-sm bg-white/40" />
            </div>
            <div className="flex items-center justify-between border-t border-white/20 pt-3">
              <span className="font-label-rail text-label-rail text-white/70">
                Deployment Rate
              </span>
              <span className="font-body-md text-body-md font-bold">+12%</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20">
            <div className="h-full w-1/3 bg-white" />
          </div>
        </section>

        {/* -------------------------------------------- RIGHT: form panel */}
        <section className="relative flex flex-1 flex-col items-center justify-center bg-surface-container-lowest p-6 md:p-12">
          <div className="absolute left-8 top-8 flex items-center gap-3 md:hidden">
            <BrandMark
              sizes="40px"
              className="size-10 rounded-xl ring-1 ring-outline-variant"
            />
            <div>
              <h1 className="font-page-title text-page-title leading-tight text-primary">
                Dhwarsh
              </h1>
              <p className="font-label-rail text-label-rail uppercase tracking-widest text-on-surface-variant">
                HR Portal
              </p>
            </div>
          </div>

          <div className="bento-card w-full max-w-[380px] p-8 shadow-level-3 md:p-10">
            <div className="mb-8 text-center md:text-left">
              <span className="mb-4 inline-block rounded-full border border-orange/20 bg-orange/10 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-deep md:hidden">
                Agent Portal
              </span>
              <h2 className="mb-2 font-display-greeting text-display-greeting text-on-surface">
                Welcome Back
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Enter your agency credentials to continue.
              </p>
            </div>

            <AgentLoginForm />
          </div>
        </section>
      </main>
    </div>
  );
}
