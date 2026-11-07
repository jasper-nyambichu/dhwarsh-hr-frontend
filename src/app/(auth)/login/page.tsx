import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/features/auth/auth-shell";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

/** The main sign-in: the Admin and the Back Office. Branch Managers have `/branch-login`, agents `/agent-login`. */
export default function StaffLoginPage() {
  return (
    <AuthShell portal="admin" title="Admin login" description="Run your organisation's people, attendance and agent payments.">
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[260px]" />}>
        <StaffLoginForm />
      </Suspense>
    </AuthShell>
  );
}
