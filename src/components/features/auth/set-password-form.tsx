"use client";

import { useActionState, useState } from "react";

import { setPassword } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { PasswordField } from "@/components/shared/password-field";
import { useActionToast } from "@/hooks/use-action-toast";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/**
 * First-login password rotation, gated by `users.must_change_password`.
 *
 * The strength meter mirrors the rules in `changePasswordSchema` so the
 * feedback shown here matches what the action will actually accept.
 */

const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    setPassword,
    { status: "idle" },
  );
  const [password, setPasswordValue] = useState("");

  const error = state.status === "error" ? state : undefined;
  const fieldErrors = error?.fieldErrors;
  const met = RULES.filter((r) => r.test(password)).length;

  // Success redirects to the role home; only failures surface here.
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-5">
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
          htmlFor="currentPassword"
        >
          Current password
        </label>
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          required
          autoComplete="current-password"
          leadingIcon="lock"
          invalid={Boolean(fieldErrors?.currentPassword)}
          className="h-10"
        />
        {fieldErrors?.currentPassword ? (
          <p className="mt-1 text-[10px] text-error">
            {fieldErrors.currentPassword[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1 block font-body-md text-body-md font-semibold text-on-surface"
          htmlFor="newPassword"
        >
          New password
        </label>
        <div onChange={(e) => setPasswordValue((e.target as HTMLInputElement).value)}>
          <PasswordField
            id="newPassword"
            name="newPassword"
            required
            autoComplete="new-password"
            leadingIcon="key"
            invalid={Boolean(fieldErrors?.newPassword)}
            className="h-10"
          />
        </div>

        {/* Strength meter */}
        <div className="mt-2 flex gap-1">
          {RULES.map((rule, i) => (
            <span
              key={rule.label}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < met
                  ? met === RULES.length
                    ? "bg-tertiary"
                    : "bg-orange"
                  : "bg-surface-container-highest",
              )}
            />
          ))}
        </div>

        <ul className="mt-2 space-y-1">
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 font-body-md text-[10px] transition-colors",
                  ok ? "text-tertiary" : "text-on-surface-variant",
                )}
              >
                <Icon
                  name={ok ? "check_circle" : "radio_button_unchecked"}
                  filled={ok}
                  className="text-[12px]"
                />
                {rule.label}
              </li>
            );
          })}
        </ul>

        {fieldErrors?.newPassword ? (
          <p className="mt-1 text-[10px] text-error">{fieldErrors.newPassword[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1 block font-body-md text-body-md font-semibold text-on-surface"
          htmlFor="confirmPassword"
        >
          Confirm new password
        </label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          required
          autoComplete="new-password"
          leadingIcon="key"
          invalid={Boolean(fieldErrors?.confirmPassword)}
          className="h-10"
        />
        {fieldErrors?.confirmPassword ? (
          <p className="mt-1 text-[10px] text-error">
            {fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="custom-shadow-card mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-navy font-body-md text-body-md font-bold text-white transition-all hover:-translate-y-px hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/70 disabled:hover:translate-y-0"
      >
        {pending ? (
          <>
            <Icon name="autorenew" className="spin-slow text-[16px]" />
            Saving...
          </>
        ) : (
          <>
            Set password
            <Icon name="arrow_forward" className="text-[16px]" />
          </>
        )}
      </button>
    </form>
  );
}
