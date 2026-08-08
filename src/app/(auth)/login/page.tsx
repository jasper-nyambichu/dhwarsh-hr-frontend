import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Icon } from "@/components/ui/icon";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";

export const metadata: Metadata = {
  title: "Staff Login",
};

/**
 * Staff sign-in. Entry point for every STAFF-principal role:
 * SUPER_ADMIN, ADMIN, HR_MANAGER, PAYROLL_OFFICER, BRANCH_MANAGER,
 * FINANCE_OFFICER, AUDITOR.
 *
 * After authentication the action redirects to ROLE_HOME[role], so all seven
 * share one door but land in their own namespace.
 */
export default function StaffLoginPage() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface-container-lowest font-body-md text-on-surface">
      {/* ---------------------------------------------- LEFT: brand (48%) */}
      <div className="relative hidden h-full w-[48%] flex-col overflow-hidden bg-gradient-to-b from-primary-container to-on-primary-fixed-variant p-10 lg:flex">
        <div className="z-10 mb-auto">
          <Image
            src="/logo.png"
            alt="Dhwarsh"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-xl border border-white/20 object-cover shadow-lg"
          />
        </div>

        <div className="relative z-10 mb-32 mt-20 max-w-md">
          <h1 className="mb-4 text-[30px] font-bold leading-tight tracking-tight text-white">
            Your whole workforce, one clear view.
          </h1>
          <p className="font-body-md text-body-md text-white/70">
            Dhwarsh HR: Integrated Kenya payroll &amp; attendance.
          </p>

          {/* Floating stat cards */}
          <div className="pointer-events-none absolute -right-32 top-1/2 flex -translate-y-1/2 flex-col gap-6">
            <div className="glass-card w-48 translate-x-12 animate-[pulse_4s_ease-in-out_infinite] rounded-xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container/30">
                  <Icon
                    name="check_circle"
                    filled
                    className="text-sm text-tertiary-fixed-dim"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/80">
                    Present today
                  </p>
                  <p className="text-lg font-bold text-white">231</p>
                </div>
              </div>
            </div>

            <div className="glass-card w-48 -translate-x-4 animate-[pulse_5s_ease-in-out_infinite] rounded-xl p-4 shadow-2xl">
              <p className="mb-2 text-[10px] font-bold uppercase text-white/80">
                Department Spread
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-white/20"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="text-tertiary-fixed-dim"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="60, 100"
                      strokeWidth="4"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim" />
                    <span className="text-[10px] text-white/70">Ops 60%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/70">Other 40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-0 -mb-32 -mr-32 h-96 w-96 rounded-full bg-primary-fixed-dim/10 blur-3xl" />
      </div>

      {/* --------------------------------------------- RIGHT: form (52%) */}
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-surface-container-lowest lg:w-[52%]">
        <div className="absolute left-8 top-8 lg:hidden">
          <Image
            src="/logo.png"
            alt="Dhwarsh"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover shadow-sm"
          />
        </div>

        <div className="w-full max-w-[380px] px-6">
          <div className="mb-8">
            <h2 className="mb-2 font-display-greeting text-display-greeting text-on-surface">
              Welcome back
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Please enter your details to sign in.
            </p>
          </div>

          {/* useSearchParams needs a Suspense boundary during prerender. */}
          <Suspense fallback={<div className="h-[360px]" />}>
            <StaffLoginForm />
          </Suspense>
        </div>

        <div className="absolute bottom-8 flex w-full justify-center gap-6 px-6 text-[10px] font-medium text-on-surface-variant">
          <Link
            href="/agent-login"
            className="group flex items-center gap-1 transition-colors hover:text-primary"
          >
            Agent Portal
            <Icon
              name="arrow_forward"
              className="text-[12px] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <span className="text-outline-variant">|</span>
          <Link
            href="/employee-login"
            className="group flex items-center gap-1 transition-colors hover:text-primary"
          >
            Employee Self-Service
            <Icon
              name="arrow_forward"
              className="text-[12px] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
