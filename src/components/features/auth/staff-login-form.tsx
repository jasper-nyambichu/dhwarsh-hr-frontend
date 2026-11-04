"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { PasswordField } from "@/components/shared/password-field";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/types";

/**
 * Staff sign-in form.
 *
 * Field note: the Stitch screen labels this "Email", but `users` has no email
 * column — the credential is `users.username VARCHAR(100) UNIQUE`. Labelled
 * "Username" and posted as `username` so the form matches what the backend
 * can actually authenticate. Revert to email only once a column exists.
 */
export function StaffLoginForm({
  action = login,
  forgotHref = "/forgot-password",
}: {
  action?: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  forgotHref?: string;
}) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    { status: "idle" },
  );

  const error = state.status === "error" ? state : undefined;
  const fieldErrors = error?.fieldErrors;

  // Success redirects, and the login action queues its toast for the next page.
  // The inline banner stays — the toast is what a user on a small screen sees.
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {/* Top-level failure (bad credentials, server unreachable). */}
      {error && !fieldErrors ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/40 px-3 py-2"
        >
          <Icon name="error" className="mt-px text-[16px] text-error" />
          <p className="font-body-md text-body-md text-on-error-container">
            {error.message}
          </p>
        </div>
      ) : null}

      <div>
        <label
          className="mb-1 block font-body-md text-body-md font-semibold text-on-surface"
          htmlFor="username"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          placeholder="e.g. j.kamau"
          aria-invalid={fieldErrors?.username ? true : undefined}
          className={`h-10 w-full rounded-lg border bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface transition-shadow placeholder:text-outline-variant focus:outline-none focus:ring-1 ${
            fieldErrors?.username
              ? "border-error focus:border-error focus:ring-error/30"
              : "border-outline-variant focus:border-primary focus:ring-primary/30"
          }`}
        />
        {fieldErrors?.username ? (
          <p className="mt-1 text-[10px] text-error">{fieldErrors.username[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1 block font-body-md text-body-md font-semibold text-on-surface"
          htmlFor="password"
        >
          Password
        </label>
        <PasswordField
          required
          invalid={Boolean(fieldErrors?.password)}
          className="h-10"
        />
        {fieldErrors?.password ? (
          <p className="mt-1 text-[10px] text-error">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary/30"
          />
          <span className="font-body-md text-body-md text-on-surface-variant transition-colors group-hover:text-on-surface">
            Remember me
          </span>
        </label>

        <Link
          href={forgotHref}
          className="font-body-md text-body-md font-semibold text-primary transition-colors hover:text-primary-container"
        >
          Forgot password?
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="custom-shadow-card flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-navy font-body-md text-body-md font-bold text-white transition-all hover:-translate-y-px hover:bg-navy/90 hover:shadow-[0_8px_24px_rgb(11_42_69_/_0.1)] disabled:cursor-not-allowed disabled:bg-navy/70 disabled:hover:translate-y-0"
        >
          {pending ? (
            <>
              <Icon name="autorenew" className="spin-slow text-[16px]" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
    </form>
  );
}
