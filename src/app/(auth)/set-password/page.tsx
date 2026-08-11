import type { Metadata } from "next";

import { Icon } from "@/components/ui/icon";
import { BrandLockup } from "@/components/shared/brand-logo";
import { SetPasswordForm } from "@/components/features/auth/set-password-form";
import { verifySessionAllowingPasswordChange } from "@/app/lib/dal";

export const metadata: Metadata = {
  title: "Set Your Password",
};

/**
 * Forced password rotation, gated by `users.must_change_password`.
 *
 * Reachable by every principal type — proxy.ts pins a flagged session here
 * and blocks every other route until the rotation completes.
 */
export default async function SetPasswordPage() {
  const session = await verifySessionAllowingPasswordChange();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 font-body-md text-on-surface">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mb-6 w-28 overflow-hidden rounded-3xl border-4 border-surface-container-lowest bg-white shadow-ambient-1">
          <BrandLockup eager sizes="112px" />
        </div>

        <div className="w-full rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Icon name="lock_reset" filled className="text-[22px] text-primary" />
            </div>
            <h1 className="mb-2 font-display-greeting text-display-greeting text-on-surface">
              Set your password
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Signed in as{" "}
              <span className="font-semibold text-on-surface">
                {session.username}
              </span>
              . Choose a new password to continue.
            </p>
          </div>

          <SetPasswordForm />
        </div>

        <p className="mt-6 max-w-sm text-center font-login-footer text-login-footer text-on-surface-variant">
          For your security, this step is required before you can access the
          portal.
        </p>
      </div>
    </div>
  );
}
