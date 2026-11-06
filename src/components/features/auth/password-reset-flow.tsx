"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { requestResetCodeAction, resetPasswordAction, verifyResetCodeAction } from "@/app/actions/password-reset";
import { PasswordField } from "@/components/shared/password-field";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/lib/toast";
import type { ActionState } from "@/types";

/**
 * Forgotten password: who you are, the emailed code, then a new password.
 *
 * Clicking the button in the email fills the code in by itself. That message travels over a
 * BroadcastChannel, which only reaches tabs of this site in this same browser, on purpose: if a link opened
 * anywhere unlocked whichever tab asked for the code, someone could ask for a code on another person's
 * account, wait for them to click the email, and take over their account.
 */

export const RESET_CHANNEL = "dhwarsh-password-reset";
export type ResetMessage = { type: "code"; identifier: string; code: string } | { type: "received" };

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

const BUTTON =
  "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy font-body-md text-body-md font-bold text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/70";
const INPUT =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

export function ResetCard({ title, description, children, backHref }: { title: string; description: string; children: React.ReactNode; backHref: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-card bg-surface-container-lowest p-6 shadow-ambient-1 sm:p-8">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-blue-soft text-primary-container">
          <Icon name="lock_reset" />
        </span>
        <h1 className="mb-1 font-login-title text-login-title text-navy">{title}</h1>
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">{description}</p>
        {children}
        <Link href={backHref} className="mt-6 flex items-center gap-1 font-body-md text-body-md font-semibold text-primary hover:underline">
          <Icon name="arrow_back" className="text-[18px]" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 font-body-md text-body-md text-on-error-container">
      {message}
    </p>
  );
}

/**
 * Pops up over the code screen once the code is right. Escape and clicks outside are ignored, so a stray
 * click cannot lose the verified code; Cancel starts over.
 */
function NewPasswordDialog({ token, onCancel }: { token: string; onCancel: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(resetPasswordAction, { status: "idle" });
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-password-title"
      onCancel={(event) => event.preventDefault()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-ambient-3 backdrop:bg-primary/70 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 motion-reduce:open:animate-none"
    >
      <div className="p-6 sm:p-8">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-tertiary-container/15 text-tertiary-container">
          <Icon name="verified_user" />
        </span>
        <h2 id="new-password-title" className="mb-1 font-login-title text-login-title text-navy">Set a new password</h2>
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">Code accepted. Choose a new password and type it again to confirm.</p>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label htmlFor="newPassword" className="mb-1 block font-body-md text-body-md font-semibold text-on-surface">New password</label>
          <PasswordField id="newPassword" name="newPassword" required autoComplete="new-password" value={next} onChange={setNext} invalid={Boolean(errors?.newPassword)} className="h-11" />
          <p className="mt-1 text-[11px] text-outline">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
          {errors?.newPassword ? <p className="mt-1 text-xs text-error">{errors.newPassword[0]}</p> : null}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block font-body-md text-body-md font-semibold text-on-surface">Confirm new password</label>
          <PasswordField id="confirmPassword" name="confirmPassword" required autoComplete="new-password" value={confirm} onChange={setConfirm} invalid={Boolean(errors?.confirmPassword)} className="h-11" />
          {errors?.confirmPassword ? <p className="mt-1 text-xs text-error">{errors.confirmPassword[0]}</p> : null}
        </div>
        <button type="submit" disabled={pending} className={BUTTON}>{pending ? "Saving…" : "Save new password"}</button>
        <ErrorLine message={state.status === "error" && !errors ? state.message : null} />
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="font-body-md text-body-md font-semibold text-on-surface-variant hover:underline disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </form>
      </div>
    </dialog>
  );
}

function CodeBoxes({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function put(index: number, typed: string) {
    const digits = typed.replace(/\D/g, "");
    if (!digits) return;
    const next = (value.slice(0, index) + digits).slice(0, CODE_LENGTH);
    onChange(next);
    refs.current[Math.min(next.length, CODE_LENGTH - 1)]?.focus();
  }

  return (
    <div role="group" aria-label="6-digit code" className="flex justify-between gap-2">
      {Array.from({ length: CODE_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
          maxLength={CODE_LENGTH}
          value={value[index] ?? ""}
          onChange={(event) => put(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[index] && index > 0) {
              onChange(value.slice(0, index - 1));
              refs.current[index - 1]?.focus();
            }
            if (event.key === "Backspace" && value[index]) {
              onChange(value.slice(0, index));
            }
          }}
          className="h-14 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest text-center text-xl font-bold tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
        />
      ))}
    </div>
  );
}

export function PasswordResetFlow({
  backHref,
  fromLink,
}: {
  backHref: string;
  /** Set when the email's link opened in this tab: the code goes straight in. */
  fromLink?: { identifier: string; code: string };
}) {
  const [step, setStep] = useState<"identifier" | "code">(fromLink ? "code" : "identifier");
  const [identifier, setIdentifier] = useState(fromLink?.identifier ?? "");
  const [code, setCode] = useState(fromLink?.code ?? "");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [pending, startTransition] = useTransition();

  const verify = useCallback((forIdentifier: string, forCode: string) => {
    startTransition(async () => {
      const result = await verifyResetCodeAction(forIdentifier, forCode);
      if (result.status === "success") {
        setToken(result.data);
      } else if (result.status === "error") {
        setError(result.message);
        setCode("");
      }
    });
  }, []);

  function askForCode() {
    startTransition(async () => {
      const result = await requestResetCodeAction(identifier);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setError(null);
      setCode("");
      setStep("code");
      setResendIn(RESEND_SECONDS);
      toast.info("If that account has an email address, a code is on its way.");
    });
  }

  useEffect(() => {
    if (fromLink) verify(fromLink.identifier, fromLink.code);
    // Once, when this tab was opened by the email's link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While waiting for the code, the email's link can hand it over from another tab of this browser.
  useEffect(() => {
    if (step !== "code" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(RESET_CHANNEL);
    channel.onmessage = (event: MessageEvent<ResetMessage>) => {
      if (event.data.type !== "code") return;
      channel.postMessage({ type: "received" } satisfies ResetMessage);
      setError(null);
      setIdentifier(event.data.identifier);
      setCode(event.data.code);
      verify(event.data.identifier, event.data.code);
    };
    return () => channel.close();
  }, [step, verify]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  if (step === "identifier") {
    return (
      <ResetCard title="Forgot your password?" description="Enter your username or email, and we will send a code to the email on your account." backHref={backHref}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            askForCode();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="identifier" className="mb-1 block font-body-md text-body-md font-semibold text-on-surface">Username or email</label>
            <input id="identifier" required autoFocus autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={INPUT} />
          </div>
          <button type="submit" disabled={pending} className={BUTTON}>{pending ? "Sending…" : "Send code"}</button>
          <ErrorLine message={error} />
        </form>
      </ResetCard>
    );
  }

  return (
    <ResetCard title="Check your email" description="Press the button in the email and this page will continue by itself, or type the 6-digit code here." backHref={backHref}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          verify(identifier, code);
        }}
        className="flex flex-col gap-4"
      >
        <CodeBoxes
          value={code}
          disabled={pending}
          onChange={(next) => {
            setCode(next);
            setError(null);
            if (next.length === CODE_LENGTH) verify(identifier, next);
          }}
        />
        <button type="submit" disabled={pending || code.length < CODE_LENGTH} className={BUTTON}>{pending ? "Checking…" : "Continue"}</button>
        <ErrorLine message={error} />
        <p className="text-center text-xs text-on-surface-variant">
          The code works for 10 minutes. Not there? Check your spam folder.
        </p>
        <button
          type="button"
          data-live=""
          disabled={pending || resendIn > 0 || !identifier}
          onClick={askForCode}
          className="font-body-md text-body-md font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-outline disabled:no-underline"
        >
          {resendIn > 0 ? `Send a new code in ${resendIn}s` : "Send a new code"}
        </button>
      </form>
      {token ? (
        <NewPasswordDialog
          token={token}
          onCancel={() => {
            setToken(null);
            setCode("");
            setError(null);
            setStep("identifier");
          }}
        />
      ) : null}
    </ResetCard>
  );
}
