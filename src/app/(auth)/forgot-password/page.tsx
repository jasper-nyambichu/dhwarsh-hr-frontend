import type { Metadata } from "next";

import { PasswordResetFlow } from "@/components/features/auth/password-reset-flow";

export const metadata: Metadata = { title: "Forgot Password" };

const BACK: Record<string, string> = { branch: "/branch-login", agent: "/agent-login" };

/** Reached from each login page's "Forgot password?" link, and returns to that same page. */
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;

  return <PasswordResetFlow backHref={(from && BACK[from]) || "/login"} />;
}
