import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Admin Login" };

/**
 * The Admin (and Back Office) sign-in. The Branch Manager signs in at `/branch/login` and agents at `/agent/login`;
 * the arrows under the card lead to both.
 */
export default async function StaffLoginPage() {
  const branding = await getOrganisationBranding();
  const organisation = branding.name ?? "your organisation";

  return (
    <LoginLayout
      portal="admin"
      branding={branding}
      title="Admin login"
      subtitle={`Log in to the ${organisation} admin portal.`}
      panelText="Every branch, every agent, one clear view. Enter your details to continue."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[260px]" />}>
        <StaffLoginForm />
      </Suspense>
    </LoginLayout>
  );
}
