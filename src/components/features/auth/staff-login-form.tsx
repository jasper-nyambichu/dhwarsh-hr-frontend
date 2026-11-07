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
 * The sign-in form shared by all three login pages (Admin and Back Office, Branch Manager, Agent), so
 * they look and behave the same; each page passes its own action and reset link. Every role signs in
 * with `users.username` and a password, which is what every action reads.
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
    <form action={formAction} className="flex flex-col gap-4">
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
        <label className="sr-only" htmlFor="username">
          Username
        </label>
        <div className="relative flex items-center">
          <Icon name="person" className="pointer-events-none absolute left-3 text-[18px] text-outline" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="Username"
            aria-invalid={fieldErrors?.username ? true : undefined}
            className={`h-12 w-full rounded-lg border-2 bg-surface-container-lowest pl-10 pr-3 font-body-md text-base text-on-surface transition-shadow placeholder:text-outline focus:outline-none focus:ring-2 sm:text-body-md ${
              fieldErrors?.username
                ? "border-error focus:ring-error/20"
                : "border-primary/40 focus:border-primary focus:ring-primary/20"
            }`}
          />
        </div>
        {fieldErrors?.username ? (
          <p className="mt-1 text-xs text-error">{fieldErrors.username[0]}</p>
        ) : null}
      </div>

      <div>
        <label className="sr-only" htmlFor="password">
          Password
        </label>
        <PasswordField
          required
          leadingIcon="lock"
          placeholder="Password"
          invalid={Boolean(fieldErrors?.password)}
          className={`h-12 border-2 text-base sm:text-body-md ${fieldErrors?.password ? "" : "border-primary/40 focus:border-primary"}`}
        />
        {fieldErrors?.password ? (
          <p className="mt-1 text-xs text-error">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
            Keep me logged in
          </span>
        </label>

        <Link href={forgotHref} className="text-sm text-on-surface-variant transition-colors hover:text-primary">
          Forgot password? <span className="font-semibold text-primary">Reset now</span>
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold uppercase tracking-wider text-on-primary shadow-md transition-all hover:-translate-y-px hover:bg-primary-container hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-48"
      >
        {pending ? (
          <>
            <Icon name="autorenew" className="spin-slow text-[16px]" />
            Signing in…
          </>
        ) : (
          "Login"
        )}
      </button>
    </form>
  );
}
