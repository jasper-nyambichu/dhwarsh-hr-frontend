import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/shared/brand-logo";
import { EmployeeLoginForm } from "@/components/features/auth/employee-login-form";

export const metadata: Metadata = {
  title: "Employee Self-Service",
};

/**
 * Employee self-service sign-in. Sole entry point for the EMPLOYEE role,
 * which lands in the /me namespace.
 *
 * Separate from staff login because the credential differs: employee number
 * plus PIN rather than username plus password.
 */
export default function EmployeeLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-bg p-gutter font-body-md text-on-surface">
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* A tile rather than the circle this started as: the emblem is wider
            than it is tall and its checkmark runs to the artwork's right edge,
            so a circular mask clips the brand. */}
        <div className="mb-8 w-32 overflow-hidden rounded-3xl border-4 border-surface-container-lowest bg-white shadow-ambient-1">
          <BrandLockup eager sizes="128px" />
        </div>

        <div className="w-full rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1">
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-login-title text-login-title text-navy">
              Employee Self-Service
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Access your payslips and attendance.
            </p>
          </div>

          <EmployeeLoginForm />

          <div className="mt-8 text-center">
            <p className="font-login-footer text-login-footer text-on-surface-variant">
              Forgot PIN?{" "}
              <Link href="/forgot-password" className="text-blue hover:underline">
                Contact your HR office
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 text-[10px] font-medium text-on-surface-variant">
          <Link href="/login" className="transition-colors hover:text-primary">
            Staff Login
          </Link>
          <span className="text-outline-variant">|</span>
          <Link href="/agent-login" className="transition-colors hover:text-primary">
            Agent Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
