"use client";

import { useId, useRef, type ComponentProps, type FormEvent } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  message: string;
  /** Who or what this is about, e.g. the employee's name. Shown in its own box. */
  subject?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: string;
  /** Deleting, rejecting and the like: a red button, with Cancel focused so Enter is safe. */
  danger?: boolean;
};

/**
 * A <form> that asks first. Use it in place of <form>: the pop-up opens after the browser has checked
 * the required fields, and the form only submits on yes. Leave `confirm` out to submit straight away.
 *
 * The pop-up sits inside the form so it never disturbs the spacing around it, and a native <dialog>
 * shows above any card or table, keeps focus inside and closes on Esc.
 */
export function ConfirmForm({
  confirm,
  children,
  ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & { confirm?: ConfirmOptions }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const asked = useRef<{ form: HTMLFormElement; submitter: HTMLElement | null } | null>(null);
  const approved = useRef(false);
  const id = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!confirm || approved.current) {
      approved.current = false;
      return;
    }
    event.preventDefault();
    asked.current = { form: event.currentTarget, submitter: (event.nativeEvent as SubmitEvent).submitter };
    dialogRef.current?.showModal();
    (confirm.danger ? cancelRef : yesRef).current?.focus();
  }

  function proceed() {
    dialogRef.current?.close();
    if (!asked.current) return;
    approved.current = true;
    asked.current.form.requestSubmit(asked.current.submitter);
  }

  return (
    <form {...props} onSubmit={handleSubmit}>
      {children}
      {confirm ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-message`}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialogRef.current?.close();
          }}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-3xl bg-surface-container-lowest p-0 text-center font-normal tracking-normal whitespace-normal normal-case text-on-surface shadow-ambient-3 backdrop:bg-primary/70 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 motion-reduce:open:animate-none"
        >
          <div className="relative flex justify-center bg-primary-container px-6 py-7">
            <span className="flex size-[72px] items-center justify-center rounded-2xl bg-surface-container-lowest text-primary-container shadow-ambient-2">
              <Icon name={confirm.icon ?? (confirm.danger ? "delete" : "help")} filled className="text-[40px]!" />
            </span>
            <span aria-hidden className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-primary-container" />
          </div>

          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-7 sm:px-8">
            <h2 id={`${id}-title`} className="text-2xl font-bold leading-tight text-on-primary-fixed">
              {confirm.title}
            </h2>
            <p id={`${id}-message`} className="text-sm leading-relaxed text-on-surface-variant">
              {confirm.message}
            </p>
            {confirm.subject ? (
              <p className="w-full break-words rounded-lg bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface">
                {confirm.subject}
              </p>
            ) : null}

            <div className="mt-2 flex w-full flex-col items-center gap-1">
              <button
                ref={yesRef}
                type="button"
                onClick={proceed}
                className={cn(
                  "min-h-11 w-full rounded-full px-8 py-2 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:min-w-44",
                  confirm.danger
                    ? "bg-error text-on-error focus-visible:ring-error/50"
                    : "bg-primary-container text-on-primary focus-visible:ring-primary/50",
                )}
              >
                {confirm.confirmLabel}
              </button>
              <button
                ref={cancelRef}
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="min-h-11 rounded-full px-6 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {confirm.cancelLabel ?? "Cancel"}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </form>
  );
}
