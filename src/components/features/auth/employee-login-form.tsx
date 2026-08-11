"use client";

import { useActionState } from "react";

import { employeeLogin } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { PinInput } from "@/components/shared/pin-input";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/types";

/**
 * Employee self-service sign-in: employee number + 4-digit PIN.
 *
 * Credential note: the number is `employees.employee_number VARCHAR(30)
 * UNIQUE`. The PIN maps to `users.password`, which is a bcrypt hash — a
 * 4-digit PIN is only 10,000 combinations, so the backend must enforce
 * attempt throttling and lockout. There is no rate limit that can live on
 * this side of the wire.
 */
export function EmployeeLoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    employeeLogin,
    { status: "idle" },
  );

  const error = state.status === "error" ? state : undefined;
  const fieldErrors = error?.fieldErrors;

  // A successful sign-in redirects, so there is no success toast to show here.
  // Failures are announced as well as rendered inline: on a phone the submit
  // button sits below the fold of the error banner.
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-stack-md">
      {error && !fieldErrors ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded border border-error/30 bg-error-container/40 px-3 py-2"
        >
          <Icon name="error" className="mt-px text-[16px] text-error" />
          <p className="font-body-md text-body-md text-on-error-container">
            {error.message}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label
          className="font-table-header text-table-header uppercase tracking-wider text-on-surface-variant"
          htmlFor="employeeNumber"
        >
          Employee Number
        </label>
        <input
          id="employeeNumber"
          name="employeeNumber"
          type="text"
          required
          autoComplete="username"
          placeholder="e.g. EMP-1042"
          aria-invalid={fieldErrors?.employeeNumber ? true : undefined}
          className={`w-full rounded border bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface shadow-sm transition-colors focus:outline-none focus:ring-1 ${
            fieldErrors?.employeeNumber
              ? "border-error focus:border-error focus:ring-error"
              : "border-line focus:border-blue focus:ring-blue"
          }`}
        />
        {fieldErrors?.employeeNumber ? (
          <p className="text-[10px] text-error">{fieldErrors.employeeNumber[0]}</p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <label className="font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
          Secure PIN
        </label>
        <PinInput invalid={Boolean(fieldErrors?.pin)} disabled={pending} />
        {fieldErrors?.pin ? (
          <p className="text-[10px] text-error">{fieldErrors.pin[0]}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-navy px-4 py-3 font-bold text-on-primary shadow-ambient-1 transition-colors hover:-translate-y-px hover:bg-primary hover:shadow-ambient-2 active:translate-y-0 active:shadow-ambient-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {pending ? (
          <>
            <Icon name="autorenew" className="spin-slow text-[18px]" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <Icon name="arrow_forward" className="text-[18px]" />
          </>
        )}
      </button>
    </form>
  );
}
