"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState, type CSSProperties, type ReactNode } from "react";

import { login } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/**
 * The sign-in fields, used by each of the three login pages (see LoginLayout). Every role signs in with
 * `users.username` and a password, which is what every action reads.
 *
 * The look follows the design the client chose (2026-11-20): small labels above plain bordered fields, the password's
 * eye inside its field, "Remember me" and "Forgot password?" on one line, and a full-width button in the portal's
 * colour. `accent` (a hex colour) tints the focus ring, the tick box and the link.
 */
export function StaffLoginForm({
  action = login,
  forgotHref = "/forgot-password",
  submitLabel = "Login",
  accent = "#1849d8",
  buttonClass = "bg-[#0f2a6b] hover:bg-[#1849d8]",
}: {
  action?: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  forgotHref?: string;
  submitLabel?: string;
  accent?: string;
  buttonClass?: string;
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
    <form action={formAction} className="flex flex-col gap-4" style={{ "--accent": accent } as CSSProperties}>
      <input type="hidden" name="next" value={next} />

      {/* Top-level failure (bad credentials, server unreachable). */}
      {error && !fieldErrors ? (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/40 px-3 py-2">
          <Icon name="error" className="mt-px text-[16px] text-error" />
          <p className="font-body-md text-body-md text-on-error-container">{error.message}</p>
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#14213d]" htmlFor="username">
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
        <label className="mb-1.5 block text-xs font-semibold text-[#14213d]" htmlFor="password">
          Password
        </label>
        <Field icon="lock" invalid={Boolean(fieldErrors?.password)}>
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
            className="mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
          </button>
        </Field>
        {fieldErrors?.password ? <p className="mt-1 text-xs text-error">{fieldErrors.password[0]}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label className="group flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="remember" className="size-4 cursor-pointer rounded border-slate-400 accent-[var(--accent)]" />
          <span className="text-sm text-on-surface-variant transition-colors group-hover:text-on-surface">Remember me</span>
        </label>
        <Link href={forgotHref} className="text-sm font-medium text-[var(--accent)] hover:underline">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70",
          buttonClass,
        )}
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

/** A field from the design: a plain bordered box with an icon before the text. */
function Field({ icon, invalid, children }: { icon: string; invalid: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-12 items-center rounded-lg border bg-white transition-shadow focus-within:ring-4",
        invalid
          ? "border-error focus-within:ring-error/15"
          : "border-slate-300 focus-within:border-[var(--accent)] focus-within:ring-[var(--accent)]/15",
      )}
    >
      <Icon name={icon} className="ml-3.5 mr-2.5 shrink-0 text-[20px] leading-none text-slate-500" />
      {children}
    </div>
  );
}
