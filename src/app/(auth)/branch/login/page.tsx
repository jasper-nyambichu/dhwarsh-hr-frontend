import type { Metadata } from "next";
import { Suspense } from "react";

import { branchLogin } from "@/app/actions/auth";
import { LOGIN_THEMES, LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Branch Login" };

/** The Branch Manager's sign-in, in green. */
export default async function Page() {
  const branding = await getOrganisationBranding();
  const theme = LOGIN_THEMES.branch;

  return (
    <LoginLayout
      portal="branch"
      branding={branding}
      tagline="Centralized attendance, smart leave governance, and verified branch operations."
      subtitle="Sign in to manage your branch."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[300px]" />}>
        <StaffLoginForm action={branchLogin} forgotHref="/forgot-password?from=branch" accent={theme.accent} buttonClass={theme.button} />
      </Suspense>
    </LoginLayout>
  );
}
