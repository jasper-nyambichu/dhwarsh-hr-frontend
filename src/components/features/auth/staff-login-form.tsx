"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { PasswordField } from "@/components/shared/password-field";
import { useActionToast } from "@/hooks/use-action-toast";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/** Each login page's colours for the fields and the button. */
export type LoginFormTheme = {
  /** Focus border and ring of the fields, the checkbox and the reset link. */
  focus: string;
  link: string;
  checkbox: string;
  /** The Login button. */
  button: string;
};

// Filled fields, after the Stitch design: a light tint at rest, white with the portal's ring on focus.
const FIELD =
  "h-12 w-full rounded-xl border border-outline-variant/40 bg-[#f0f3ff] px-4 font-body-md text-base text-on-surface shadow-sm transition-all placeholder:text-outline focus:bg-white focus:outline-none focus:ring-4 sm:text-sm";

/**
 * The sign-in fields, used by each of the three login pages (each page is its own layout and theme). Every
 * role signs in with `users.username` and a password, which is what every action reads.
 */
export function StaffLoginForm({
  action = login,
  forgotHref = "/forgot-password",
  theme,
  submitLabel = "Log In",
}: {
  action?: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  forgotHref?: string;
  theme: LoginFormTheme;
  /** The button's words, which each portal words its own way. */
  submitLabel?: string;
}) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { status: "idle" });

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
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/30 bg-error-container/40 px-3 py-2">
          <Icon name="error" className="mt-px text-[16px] text-error" />
          <p className="font-body-md text-body-md text-on-error-container">{error.message}</p>
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          placeholder="Enter your username"
          aria-invalid={fieldErrors?.username ? true : undefined}
          className={cn(FIELD, fieldErrors?.username ? "border-error focus:ring-error/15" : theme.focus)}
        />
        {fieldErrors?.username ? <p className="mt-1 text-xs text-error">{fieldErrors.username[0]}</p> : null}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="password">
          Password
        </label>
        <PasswordField
          required
          placeholder="Enter your password"
          invalid={Boolean(fieldErrors?.password)}
          className={cn(
            "h-12 rounded-xl border-outline-variant/40 bg-[#f0f3ff] px-4 text-base shadow-sm focus:bg-white focus:ring-4 sm:text-sm",
            fieldErrors?.password ? "" : theme.focus,
          )}
        />
        {fieldErrors?.password ? <p className="mt-1 text-xs text-error">{fieldErrors.password[0]}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            className={cn("h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-container-lowest", theme.checkbox)}
          />
          <span className="text-sm text-on-surface-variant transition-colors group-hover:text-on-surface">Remember me</span>
        </label>

        <Link href={forgotHref} className={cn("text-sm font-semibold transition-colors", theme.link)}>
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-px hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0",
          theme.button,
        )}
      >
        {pending ? (
          <>
            <Icon name="autorenew" className="spin-slow text-[16px]" />
            Signing in…
          </>
        ) : (
          <>
            {submitLabel}
            <Icon name="arrow_forward" className="text-[18px]" />
          </>
        )}
      </button>
    </form>
  );
}
