"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState, type ReactNode } from "react";

import { login } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/**
 * The sign-in fields, used by each of the three login pages (see LoginLayout). Every role signs in with
 * `users.username` and a password, which is what every action reads.
 *
 * The look follows the design the client chose: white fields on a soft shadow with a blue bar on the left, an icon
 * and a thin divider before the text, and a compact "Log in" button.
 */
export function StaffLoginForm({
  action = login,
  forgotHref = "/forgot-password",
  submitLabel = "Log in",
}: {
  action?: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  forgotHref?: string;
  submitLabel?: string;
}) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  // Held here so a failed attempt keeps the username (React clears an uncontrolled form after each submit).
  const [username, setUsername] = useState("");

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
        <div role="alert" className="flex items-start gap-2 rounded-md border border-error/30 bg-error-container/40 px-3 py-2">
          <Icon name="error" className="mt-px text-[16px] text-error" />
          <p className="font-body-md text-body-md text-on-error-container">{error.message}</p>
        </div>
      ) : null}

      <div>
        <label className="sr-only" htmlFor="username">
          Username
        </label>
        <Field icon="person" invalid={Boolean(fieldErrors?.username)}>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            aria-invalid={fieldErrors?.username ? true : undefined}
            className={INPUT}
          />
        </Field>
        {fieldErrors?.username ? <p className="mt-1 text-xs text-error">{fieldErrors.username[0]}</p> : null}
      </div>

      <div>
        <label className="sr-only" htmlFor="password">
          Password
        </label>
        <Field icon="key" invalid={Boolean(fieldErrors?.password)}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            aria-invalid={fieldErrors?.password ? true : undefined}
            className={INPUT}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="mr-3 flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-[#1849d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1849d8]/40"
          >
            <Icon name={showPassword ? "visibility" : "visibility_off"} className="text-[18px]" />
          </button>
        </Field>
        {fieldErrors?.password ? <p className="mt-1 text-xs text-error">{fieldErrors.password[0]}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            className="size-4 cursor-pointer rounded-sm border-slate-400 text-[#1849d8] focus:ring-[#1849d8]/30"
          />
          <span className="text-sm text-on-surface-variant transition-colors group-hover:text-on-surface">Remember me</span>
        </label>

        <Link
          href={forgotHref}
          className="border-b border-[#14213d]/40 text-sm font-semibold text-[#14213d] transition-colors hover:border-[#1849d8] hover:text-[#1849d8]"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-4 flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-md bg-[#1849d8] px-7 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#1849d8]/30 transition-all hover:-translate-y-px hover:bg-[#123bb5] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {pending ? (
          <>
            <Icon name="autorenew" className="spin-slow text-[18px]" />
            Signing in…
          </>
        ) : (
          <>
            <Icon name="login" className="text-[18px]" />
            {submitLabel}
          </>
        )}
      </button>
    </form>
  );
}

const INPUT =
  "h-full min-w-0 flex-1 border-0 bg-transparent pr-3 font-body-md text-base text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-sm";

/** A field from the design: the blue bar on its left edge, an icon, a thin divider, then the input. */
function Field({ icon, invalid, children }: { icon: string; invalid: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex h-12 items-center overflow-hidden rounded-md bg-white shadow-[0_6px_18px_-6px_rgba(24,73,216,0.25)] ring-1 transition-shadow focus-within:ring-2",
        invalid ? "ring-error focus-within:ring-error/40" : "ring-[#dbe3f4] focus-within:ring-[#1849d8]/40",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", invalid ? "bg-error" : "bg-[#1849d8]")} />
      <Icon name={icon} className="ml-4 shrink-0 text-[20px] text-slate-500" />
      <span aria-hidden className="mx-3 h-5 w-px shrink-0 bg-slate-300" />
      {children}
    </div>
  );
}
