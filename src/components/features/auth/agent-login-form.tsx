"use client";

import Link from "next/link";
import { useActionState } from "react";

import { agentLogin } from "@/app/actions/auth";
import { Icon } from "@/components/ui/icon";
import { PasswordField } from "@/components/shared/password-field";
import type { ActionState } from "@/types";

/**
 * Agent portal sign-in: agent code + password.
 *
 * Credential note: the Stitch screen asks for an "Agent Code" (KES-XXX-XXX),
 * but the `agents` table has no code column — only id, name and kra_pin.
 * Posted as `agentCode`; the backend needs either a new unique column or a
 * mapping onto an existing one before this can authenticate.
 */
export function AgentLoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    agentLogin,
    { status: "idle" },
  );

  const error = state.status === "error" ? state : undefined;
  const fieldErrors = error?.fieldErrors;

  return (
    <form action={formAction} className="space-y-5">
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

      <div className="relative space-y-1.5">
        <label
          className="block font-label-rail text-label-rail uppercase tracking-wider text-on-surface-variant"
          htmlFor="agentCode"
        >
          Agent Code
        </label>
        <div className="relative flex items-center">
          <Icon name="badge" className="absolute left-3 text-[18px] text-outline" />
          <input
            id="agentCode"
            name="agentCode"
            type="text"
            required
            autoComplete="username"
            placeholder="KES-XXX-XXX"
            aria-invalid={fieldErrors?.agentCode ? true : undefined}
            className={`w-full rounded-lg border bg-surface-container-lowest py-2.5 pl-10 pr-4 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline-variant focus:outline-none focus:ring-1 ${
              fieldErrors?.agentCode
                ? "border-error focus:border-error focus:ring-error"
                : "border-outline-variant focus:border-primary focus:ring-primary focus:shadow-[0_0_0_2px_rgba(0,85,146,0.1)]"
            }`}
          />
        </div>
        {fieldErrors?.agentCode ? (
          <p className="text-[10px] text-error">{fieldErrors.agentCode[0]}</p>
        ) : null}
      </div>

      <div className="relative space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            className="block font-label-rail text-label-rail uppercase tracking-wider text-on-surface-variant"
            htmlFor="password"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="font-label-rail text-label-rail text-primary transition-colors hover:text-on-primary-fixed-variant"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField
          required
          leadingIcon="lock"
          invalid={Boolean(fieldErrors?.password)}
          className="py-2.5"
        />
        {fieldErrors?.password ? (
          <p className="text-[10px] text-error">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          id="remember"
          name="remember"
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary"
        />
        <label
          htmlFor="remember"
          className="cursor-pointer select-none font-body-md text-body-md text-on-surface-variant"
        >
          Keep me signed in
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-body-md text-body-md font-bold text-white shadow-md transition-all duration-200 hover:bg-on-primary-fixed-variant hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Icon name="autorenew" className="spin-slow text-[16px]" />
            Signing in...
          </>
        ) : (
          <>
            Sign in to Portal
            <Icon
              name="arrow_forward"
              className="text-[16px] transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </button>
    </form>
  );
}
