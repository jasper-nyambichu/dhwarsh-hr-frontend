import type { Metadata } from "next";
import { Suspense } from "react";

import { agentLogin } from "@/app/actions/auth";
import { AuthShell } from "@/components/features/auth/auth-shell";
import { StaffLoginForm } from "@/components/features/auth/staff-login-form";

export const metadata: Metadata = {
  title: "Agent Portal Login",
};

/**
 * Agent portal sign-in: the AGENT role, which lands in /agent. Agents are external suppliers of staff;
 * they sign in with the username and password the Admin set, like everyone else.
 */
export default function AgentLoginPage() {
  return (
    <AuthShell portal="agent" title="Agent login" description="Your employees, payslips, advances and payments.">
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-[260px]" />}>
        <StaffLoginForm action={agentLogin} forgotHref="/forgot-password?from=agent" />
      </Suspense>
    </AuthShell>
  );
}
