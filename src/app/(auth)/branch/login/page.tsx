import type { Metadata } from "next";
import { Suspense } from "react";

import { branchLogin } from "@/app/actions/auth";
import { LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Branch Login" };

/** The Branch Manager's sign-in. The arrows under the card lead to the Admin and Agent sign-ins. */
export default async function BranchLoginPage() {
  const branding = await getOrganisationBranding();
  const organisation = branding.name ?? "your organisation";

  return (
    <LoginLayout
      portal="branch"
      branding={branding}
      title="Branch login"
      subtitle={`Log in to manage your ${organisation} branch.`}
      panelText="Run your branch day by day: attendance, your team and their days off."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[260px]" />}>
        <StaffLoginForm action={branchLogin} forgotHref="/forgot-password?from=branch" />
      </Suspense>
    </LoginLayout>
  );
}
