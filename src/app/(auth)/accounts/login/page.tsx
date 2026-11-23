import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { accountsLogin } from "@/app/actions/auth";
import { LOGIN_THEMES, LoginLayout } from "@/components/features/auth/login-layout";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";
import { getOrganisationBranding } from "@/lib/api/organisation";

export const metadata: Metadata = { title: "Accounts Login" };

/**
 * The Accounts Office's sign-in, in violet, the same layout as the Admin, Branch and Agent pages. Only where the
 * organisation uses the Accounts Office (Kisiimatt); anywhere else this page does not exist.
 */
export default async function Page() {
  const branding = await getOrganisationBranding();
  if (!branding.accountsOffice) notFound();
  const theme = LOGIN_THEMES.accounts;

  return (
    <LoginLayout
      portal="accounts"
      branding={branding}
      tagline="Agent invoices, payments and proof of every transaction, in one place."
      subtitle="Sign in to the Accounts Office."
    >
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[300px]" />}>
        <StaffLoginForm action={accountsLogin} forgotHref="/forgot-password?from=accounts" accent={theme.accent} buttonClass={theme.button} />
      </Suspense>
    </LoginLayout>
  );
}
