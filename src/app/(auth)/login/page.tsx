import type { Metadata } from "next";
import { Suspense } from "react";

import { LOGIN_THEMES, LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Admin Login" };

/** The Admin (and Back Office) sign-in, in blue. The Branch Manager signs in at `/branch/login` (green) and agents at `/agent/login` (amber). */
export default async function Page() {
  const branding = await getOrganisationBranding();
  const theme = LOGIN_THEMES.admin;

  return (
    <LoginLayout
      portal="admin"
      branding={branding}
      headline="Every branch, one clear view."
      tagline="Employees, attendance, off days and agent payments in one place."
      subtitle="Sign in to the admin portal."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[300px]" />}>
        <StaffLoginForm forgotHref="/forgot-password" accent={theme.accent} buttonClass={theme.button} />
      </Suspense>
    </LoginLayout>
  );
}
