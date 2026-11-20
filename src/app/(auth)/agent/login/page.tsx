import type { Metadata } from "next";
import { Suspense } from "react";

import { agentLogin } from "@/app/actions/auth";
import { LOGIN_THEMES, LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Agent Portal Login" };

/** The agents' sign-in (external suppliers of staff), in amber/yellow. */
export default async function Page() {
  const branding = await getOrganisationBranding();
  const theme = LOGIN_THEMES.agent;

  return (
    <LoginLayout
      portal="agent"
      branding={branding}
      headline="Your people. Your pay. Always clear."
      tagline="Your employees, payslips, advances and payments in one place."
      subtitle="Sign in to your agent account."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[300px]" />}>
        <StaffLoginForm action={agentLogin} forgotHref="/forgot-password?from=agent" accent={theme.accent} buttonClass={theme.button} />
      </Suspense>
    </LoginLayout>
  );
}
