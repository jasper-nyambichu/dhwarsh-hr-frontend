import type { Metadata } from "next";
import { Suspense } from "react";

import { branchLogin } from "@/app/actions/auth";
import { AuthShell } from "@/components/features/auth/auth-shell";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";

export const metadata: Metadata = { title: "Branch Login" };

/** The Branch Managers' sign-in: same layout as the Admin and Agent pages. */
export default function BranchLoginPage() {
  return (
    <AuthShell portal="branch" title="Branch login" description="Today's attendance, your branch's team and its days off.">
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[260px]" />}>
        <StaffLoginForm action={branchLogin} forgotHref="/forgot-password?from=branch" />
      </Suspense>
    </AuthShell>
  );
}
