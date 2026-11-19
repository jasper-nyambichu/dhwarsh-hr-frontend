"use client";

import { format, parseISO } from "date-fns";
import { useActionState, useEffect, useRef, useState } from "react";

import { grantOffDayAction, removeOffDayAction, updateOffDayAction } from "@/app/actions/off-day";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { DateInput } from "@/components/shared/date-input";
import { CONTROL, FormMessage, LABEL, TextField } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";
import { MAX_OFF_DAYS_PER_MONTH, monthLabel, monthRange } from "@/lib/off-days";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/** The shared frame of the off-day dialogs: a modal that closes on the backdrop, Escape or the cross. */
function OffDayDialogFrame({
  title,
  subtitle,
  onClose,
  children,
  labelId,
}: {
  title: string;
  subtitle: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  labelId: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);
  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-ambient-3 backdrop:bg-primary/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={labelId} className="text-xl font-bold text-on-primary-fixed">{title}</h2>
            <p className="break-words text-sm text-on-surface-variant">{subtitle}</p>
          </div>
          <button data-live=""
            type="button"
            aria-label="Close"
            onClick={close}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/** Closes the dialog the clicked button sits in. */
function closeOwnDialog(event: React.MouseEvent<HTMLElement>) {
  event.currentTarget.closest("dialog")?.close();
}

function DialogButtons({ pending, submitLabel }: { pending: boolean; submitLabel: string }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button data-live=""
        type="button"
        onClick={closeOwnDialog}
        className="min-h-11 rounded-lg px-5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

/**
 * Gives one employee their days off for the month on screen: two separate days, any dates (e.g. the 3rd and the
 * 16th; next to each other is fine), never a range. When one day is already given, only the second is asked for.
 * The agent does this; the Branch Manager or the Admin can too when the agent isn't available.
 */
export function GiveOffDayDialog({
  employee,
  month,
  taken,
  onClose,
  onSaved,
}: {
  employee: { id: number; name: string; number: string };
  /** yyyy-MM: both days fall in this month. */
  month: string;
  /** The dates this employee already has off in the month (yyyy-MM-dd). */
  taken: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(grantOffDayAction, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [state, onSaved]);

  const range = monthRange(month);
  const left = Math.max(MAX_OFF_DAYS_PER_MONTH - taken.length, 0);
  const pickedTaken = (date: string) => (date && taken.includes(date) ? "Already off on this day" : null);
  const same = first && second && first === second ? "Choose a different day from the first" : null;

  return (
    <OffDayDialogFrame
      labelId="give-off-title"
      title="Give Off"
      subtitle={
        <>
          {employee.name} · <span className="font-mono text-xs">{employee.number}</span>
        </>
      }
      onClose={onClose}
    >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="employeeId" value={employee.id} />

          <p className="rounded-lg bg-blue-soft p-3 text-sm text-primary-container">
            Each employee has <strong>{MAX_OFF_DAYS_PER_MONTH} days off</strong> in {monthLabel(month)}: any two separate days.
            {taken.length > 0 ? ` Already given: ${taken.map((date) => format(parseISO(date), "EEE d MMM")).join(", ")}.` : ""}
          </p>

          {left === 0 ? (
            <p className="rounded-lg bg-surface-container-low p-3 text-sm text-on-surface">
              Both days off are already given for {monthLabel(month)}. Use <strong>Change</strong> on one of them to move it.
            </p>
          ) : (
            <div className={cn("grid grid-cols-1 gap-4", left === 2 && "sm:grid-cols-2")}>
              <div>
                <label className={LABEL} htmlFor="give-off-first">
                  {left === 2 ? "First day off" : "Day off"}
                  <span className="ml-0.5 text-error">*</span>
                </label>
                <DateInput id="give-off-first" name="date1" required value={first} onChange={setFirst} min={range.from} max={range.to} className={CONTROL} />
                {(errors?.date1?.[0] ?? pickedTaken(first)) ? <p className="mt-1 text-xs text-error">{errors?.date1?.[0] ?? pickedTaken(first)}</p> : null}
              </div>
              {left === 2 ? (
                <div>
                  <label className={LABEL} htmlFor="give-off-second">
                    Second day off<span className="ml-0.5 text-error">*</span>
                  </label>
                  <DateInput id="give-off-second" name="date2" required value={second} onChange={setSecond} min={range.from} max={range.to} className={CONTROL} />
                  {(errors?.date2?.[0] ?? same ?? pickedTaken(second)) ? (
                    <p className="mt-1 text-xs text-error">{errors?.date2?.[0] ?? same ?? pickedTaken(second)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {left > 0 ? (
            <TextField label="Reason" name="reason" maxLength={255} placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} />
          ) : null}

          <FormMessage state={state} successText={`Days off saved for ${employee.name}.`} />

          {left > 0 ? (
            <DialogButtons pending={pending} submitLabel={left === 2 ? "Save Days Off" : "Save Day Off"} />
          ) : (
            <div className="flex justify-end">
              <button data-live="" type="button" onClick={closeOwnDialog} className="min-h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-container">
                OK
              </button>
            </div>
          )}
        </form>
    </OffDayDialogFrame>
  );
}

/** Moves one off day to another date (today or later), and/or changes its reason. */
export function EditOffDayDialog({
  offDay,
  today,
  onClose,
  onSaved,
}: {
  offDay: { id: number; date: string; reason: string | null; employeeName: string };
  today: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateOffDayAction, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const [date, setDate] = useState(offDay.date);
  const [reason, setReason] = useState(offDay.reason ?? "");

  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [state, onSaved]);

  return (
    <OffDayDialogFrame
      labelId="edit-off-title"
      title="Change Day Off"
      subtitle={`${offDay.employeeName} · now ${formatDate(offDay.date)}`}
      onClose={onClose}
    >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={offDay.id} />
          <div>
            <label className={LABEL} htmlFor="edit-off-date">
              New date<span className="ml-0.5 text-error">*</span>
            </label>
            <DateInput id="edit-off-date" name="date" required value={date} onChange={setDate} min={today} className={CONTROL} />
            {errors?.date?.[0] ? <p className="mt-1 text-xs text-error">{errors.date[0]}</p> : null}
            <p className="mt-1 text-xs text-on-surface-variant">Still at most {MAX_OFF_DAYS_PER_MONTH} days off in that month.</p>
          </div>
          <TextField label="Reason" name="reason" maxLength={255} placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} />
          <FormMessage state={state} successText="Day off changed." />
          <DialogButtons pending={pending} submitLabel="Save Change" />
        </form>
    </OffDayDialogFrame>
  );
}

/** Opens EditOffDayDialog for one off day. */
export function EditOffDayButton({
  offDay,
  employeeName,
  today,
}: {
  offDay: { id: number; startDate: string; reason: string | null };
  employeeName: string;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button data-live=""
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change this day off"
        title="Change this day off"
        className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/5 hover:text-primary"
      >
        <Icon name="edit_calendar" className="text-[18px]" />
      </button>
      {open ? (
        <EditOffDayDialog
          offDay={{ id: offDay.id, date: offDay.startDate, reason: offDay.reason, employeeName }}
          today={today}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function RemoveOffDayButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(removeOffDayAction, { status: "idle" });

  return (
    <ConfirmForm
      action={formAction}
      confirm={{ title: "Remove this off day?", message: "The employee will be expected at work on that day again.", confirmLabel: "Remove", danger: true }}
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

/** Change and Remove for one off day still ahead (one that has passed stays as it was). */
export function OffDayRowActions({
  offDay,
  employeeName,
  today,
}: {
  offDay: { id: number; startDate: string; endDate: string; reason: string | null };
  employeeName: string;
  today: string;
}) {
  if (offDay.endDate < today) return null;
  return (
    <span className="flex shrink-0 items-start gap-1">
      <EditOffDayButton offDay={offDay} employeeName={employeeName} today={today} />
      <RemoveOffDayButton id={offDay.id} />
    </span>
  );
}
