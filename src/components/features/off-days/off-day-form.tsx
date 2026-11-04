"use client";

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { useActionState, useEffect, useRef, useState } from "react";

import { grantOffDayAction, removeOffDayAction } from "@/app/actions/off-day";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { DateInput } from "@/components/shared/date-input";
import { CONTROL, FormMessage, LABEL, TextField } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import { formatDateRange, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/**
 * The agent gives one employee time off. The employee is already chosen, from the card that opened this,
 * and a single day needs only one date. Nothing is lost if it was a mistake: it can be removed straight
 * after, so this asks no second "are you sure".
 */
export function GiveOffDayDialog({
  employee,
  today,
  onClose,
  onSaved,
}: {
  employee: { id: number; name: string; number: string };
  today: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(grantOffDayAction, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [severalDays, setSeveralDays] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [state, onSaved]);

  const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");
  const dayCount = severalDays && startDate && endDate ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1 : null;

  function chooseStart(next: string) {
    setStartDate(next);
    if (endDate && next > endDate) setEndDate("");
  }

  const modeClass = (active: boolean) =>
    cn(
      "min-h-10 flex-1 rounded-md text-sm font-semibold transition-colors",
      active ? "bg-surface-container-lowest text-primary shadow-ambient-1" : "text-on-surface-variant hover:text-on-surface",
    );
  const quickClass = (active: boolean) =>
    cn(
      "min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors",
      active ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low",
    );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="give-off-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-ambient-3 backdrop:bg-primary/70 backdrop:backdrop-blur-sm"
    >
      <form action={formAction} className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="give-off-title" className="text-xl font-bold text-on-primary-fixed">Give Off</h2>
            <p className="break-words text-sm text-on-surface-variant">
              {employee.name} · <span className="font-mono text-xs">{employee.number}</span>
            </p>
          </div>
          <button data-live=""
            type="button"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <input type="hidden" name="employeeId" value={employee.id} />

        <div role="group" aria-label="How long" className="flex gap-1 rounded-lg bg-surface-container-low p-1">
          <button data-live="" type="button" aria-pressed={!severalDays} onClick={() => setSeveralDays(false)} className={modeClass(!severalDays)}>
            One day
          </button>
          <button data-live="" type="button" aria-pressed={severalDays} onClick={() => setSeveralDays(true)} className={modeClass(severalDays)}>
            Several days
          </button>
        </div>

        {severalDays ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="give-off-start">From<span className="ml-0.5 text-error">*</span></label>
              <DateInput id="give-off-start" name="startDate" required value={startDate} onChange={chooseStart} className={CONTROL} />
              {errors?.startDate?.[0] ? <p className="mt-1 text-xs text-error">{errors.startDate[0]}</p> : null}
            </div>
            <div>
              <label className={LABEL} htmlFor="give-off-end">To<span className="ml-0.5 text-error">*</span></label>
              <DateInput id="give-off-end" name="endDate" required value={endDate} onChange={setEndDate} min={startDate || undefined} className={CONTROL} />
              {errors?.endDate?.[0] ? <p className="mt-1 text-xs text-error">{errors.endDate[0]}</p> : null}
            </div>
            {dayCount !== null ? (
              <p className="rounded-lg bg-blue-soft p-2 text-sm font-medium text-primary-container sm:col-span-2">
                {formatNumber(dayCount)} day{dayCount === 1 ? "" : "s"}: {formatDateRange(startDate, endDate)}
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <label className={LABEL} htmlFor="give-off-date">Date<span className="ml-0.5 text-error">*</span></label>
            <DateInput id="give-off-date" name="startDate" required value={startDate} onChange={setStartDate} className={CONTROL} />
            {errors?.startDate?.[0] ? <p className="mt-1 text-xs text-error">{errors.startDate[0]}</p> : null}
            <div className="mt-2 flex gap-2">
              <button data-live="" type="button" aria-pressed={startDate === today} onClick={() => setStartDate(today)} className={quickClass(startDate === today)}>Today</button>
              <button data-live="" type="button" aria-pressed={startDate === tomorrow} onClick={() => setStartDate(tomorrow)} className={quickClass(startDate === tomorrow)}>Tomorrow</button>
            </div>
          </div>
        )}

        <TextField label="Reason" name="reason" maxLength={255} placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} />

        <FormMessage state={state} successText={`Off day saved for ${employee.name}.`} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button data-live=""
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-lg px-5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Off Day"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function RemoveOffDayButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(removeOffDayAction, { status: "idle" });

  return (
    <ConfirmForm
      action={formAction}
      confirm={{ title: "Remove this off day?", message: "The employee will be expected at work on those dates again.", confirmLabel: "Remove", danger: true }}
      className="flex shrink-0 flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Remove this off day"
        title="Remove this off day"
        className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/5 hover:text-error disabled:opacity-60"
      >
        <Icon name="delete" className="text-[18px]" />
      </button>
      {state.status === "error" ? <span role="alert" className="max-w-40 text-right text-[11px] text-error">{state.message}</span> : null}
    </ConfirmForm>
  );
}
