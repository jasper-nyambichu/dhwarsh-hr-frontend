"use client";

import { useActionState } from "react";

import { sendTestEmailAction } from "@/app/actions/company";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, TextField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/**
 * Proves the server can send email, which every password reset code depends on. The send happens at once,
 * so a misconfigured mail server shows its own reason here instead of codes silently never arriving.
 */
export function TestEmailForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(sendTestEmailAction, { status: "idle" });

  return (
    <BentoCard
      title="Email delivery"
      subtitle="Password reset codes are emailed. Send yourself a test to confirm the server can deliver email."
    >
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextField label="Send a test to" name="to" type="email" required placeholder="you@example.com" className="flex-1" />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send test email"}
        </button>
      </form>
      <div className="mt-3" aria-live="polite">
        <FormMessage state={state} successText="Sent. Check that inbox, and its spam folder." />
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">
        A reset code only goes to a login that has an email address saved (set it on the login&apos;s card under Users, or on
        the profile page).
      </p>
    </BentoCard>
  );
}
