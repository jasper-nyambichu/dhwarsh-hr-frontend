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
    <form action={formAction} className="space-y-4" style={{ "--accent": accent } as CSSProperties}>
      <input type="hidden" name="next" value={next} />

      {/* Top-level failure (bad credentials, server unreachable). */}
      {error && !fieldErrors ? (
        <div role="alert" className="mb-1 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50 p-3.5 text-xs text-red-700">
          <Icon name="error" className="mt-0.5 shrink-0 text-[18px] text-red-500" />
          <div className="leading-relaxed">
            <strong className="block font-semibold text-red-800">Sign-in failed</strong>
            {error.message}
          </div>
        </div>
      ) : null}

      <div>
        <label className={LABEL} htmlFor="username">
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
        <FieldError message={fieldErrors?.username?.[0]} />
      </div>

      <div>
        <label className={LABEL} htmlFor="password">
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
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
          </button>
        </Field>
        <FieldError message={fieldErrors?.password?.[0]} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-0.5 text-xs">
        <label className="flex cursor-pointer select-none items-center gap-2 text-[#475569] hover:text-slate-900">
          <input type="checkbox" name="remember" className="size-4 cursor-pointer rounded border-slate-300 accent-[var(--accent)]" />
          <span className="font-medium">Remember me</span>
        </label>
        <Link
          href={forgotHref}
          className="rounded font-semibold text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1"
        >
          Forgot Password?
        </Link>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow focus:outline-none focus-visible:ring-4 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
            buttonClass,
          )}
        >
          {pending ? (
            <>
              <Icon name="progress_activity" className="animate-spin text-[20px]" />
              Signing in…
            </>
          ) : (
            <>
              <Icon name="login" className="text-[20px]" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const LABEL = "mb-1.5 block text-xs font-semibold tracking-wide text-slate-700";

const INPUT =
  "h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-slate-900 placeholder:text-[#94A3B8] focus:outline-none focus:ring-0 sm:text-sm";

/** A field from the design: a plain bordered box with an icon before the text. */
function Field({ icon, invalid, children }: { icon: string; invalid: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center rounded-lg border bg-white px-3.5 transition-all duration-200 focus-within:ring-4",
        invalid
          ? "border-red-500 bg-red-50/20 focus-within:ring-red-500/15"
          : "border-[#CBD5E1] focus-within:border-[var(--accent)] focus-within:ring-[var(--accent)]/15",
      )}
    >
      <Icon name={icon} className="mr-2.5 shrink-0 text-[20px] text-slate-400" />
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <Icon name="error" className="text-[14px]" />
      {message}
    </p>
  );
}
