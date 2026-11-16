import type { Metadata } from "next";
import { Suspense } from "react";

import { agentLogin } from "@/app/actions/auth";
import { LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Agent Portal Login" };

/**
 * The agents' sign-in (external suppliers of staff, landing in /agent). The arrows under the card lead to the
 * Admin and Branch sign-ins.
 */
export default async function AgentLoginPage() {
  const branding = await getOrganisationBranding();
  const organisation = branding.name ?? "your organisation";

  return (
    <LoginLayout
      portal="agent"
      branding={branding}
      title="Agent login"
      subtitle={`Log in to your agent account with ${organisation}.`}
      panelText="Your people, payslips, advances and payments, always clear."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[260px]" />}>
        <StaffLoginForm action={agentLogin} forgotHref="/forgot-password?from=agent" />
      </Suspense>
    </LoginLayout>
  );
}
