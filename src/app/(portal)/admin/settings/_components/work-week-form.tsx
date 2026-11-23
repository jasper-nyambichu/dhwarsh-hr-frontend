"use client";

import { useActionState, useState } from "react";

import { saveOperationsAction } from "@/app/actions/company";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";
import type { OrganisationOperations, WorkWeekDay } from "@/lib/api/company";
import type { ActionState } from "@/types";

const TIME =
  "min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 md:text-sm";

function label(day: string): string {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

/**
 * How the organisation operates, after how it actually works: each day of the week open or closed with its own
 * hours (e.g. Monday–Saturday 8 am–6 pm, Sunday 8 am–1 pm), and whether only one employee of a department may be
 * off on the same day. Late arrivals and early leaving are measured against each day's hours; a closed day is not
 * counted as missed. Can be changed at any time.
 */
export function WorkWeekForm({ initial, readOnly }: { initial: OrganisationOperations; readOnly: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveOperationsAction, { status: "idle" });
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(initial.week.map((day) => [day.dayOfWeek, day.working])),
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Save the work week?",
        message: "Attendance records measure late arrival and early leaving against these hours from now on.",
        confirmLabel: "Save",
        icon: "schedule",
      }}
    >
      <BentoCard
        title="Work week"
        subtitle="The days the organisation works and its hours on each. Arriving after the start is late; leaving before the end is early. A closed day is not counted as missed."
      >
        <fieldset disabled={readOnly || pending} className="flex flex-col gap-2">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-3 font-table-header text-table-header uppercase text-outline sm:grid">
            <span>Day</span>
            <span>Open</span>
            <span>Starts</span>
            <span>Ends</span>
          </div>
          {initial.week.map((day: WorkWeekDay) => {
            const working = open[day.dayOfWeek] ?? false;
            const error = errors?.[day.dayOfWeek]?.[0];
            return (
              <div
                key={day.dayOfWeek}
                className={cn(
                  "grid grid-cols-2 items-center gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]",
                  working ? "border-outline-variant/60" : "border-dashed border-outline-variant/60 bg-surface-container-low/60",
                )}
              >
                <span className="font-semibold text-on-surface">{label(day.dayOfWeek)}</span>
                <label className="flex cursor-pointer items-center justify-end gap-2 text-sm sm:justify-start">
                  <input
                    type="checkbox"
                    name={`${day.dayOfWeek}-working`}
                    checked={working}
                    onChange={(event) => setOpen((current) => ({ ...current, [day.dayOfWeek]: event.target.checked }))}
                    className="size-4 accent-primary"
                  />
                  <span className={working ? "font-medium text-tertiary" : "text-on-surface-variant"}>{working ? "Open" : "Closed"}</span>
                </label>
                <label className="flex flex-col gap-1 text-xs text-outline sm:block">
                  <span className="sm:sr-only">Starts</span>
                  <input type="time" name={`${day.dayOfWeek}-start`} defaultValue={day.startTime.slice(0, 5)} required className={TIME} aria-label={`${label(day.dayOfWeek)} starts`} />
                </label>
                <label className="flex flex-col gap-1 text-xs text-outline sm:block">
                  <span className="sm:sr-only">Ends</span>
                  <input type="time" name={`${day.dayOfWeek}-end`} defaultValue={day.endTime.slice(0, 5)} required className={TIME} aria-label={`${label(day.dayOfWeek)} ends`} />
                </label>
                {error ? <p className="col-span-2 text-xs text-error sm:col-span-4">{error}</p> : null}
              </div>
            );
          })}

          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/60 p-3">
            <input type="checkbox" name="oneOffPerDepartment" defaultChecked={initial.oneOffPerDepartment} className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block font-semibold text-on-surface">Only one employee per department off on the same day</span>
              <span className="block text-sm text-on-surface-variant">
                Within a branch, a second employee of the same department cannot be given the same day off. Leave unticked to allow several.
              </span>
            </span>
          </label>
        </fieldset>

        {!readOnly ? (
          <div className="mt-5 flex flex-col gap-3">
            <FormMessage state={state} successText="Work week saved." />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save Work Week"}
              </button>
            </div>
          </div>
        ) : null}
      </BentoCard>
    </ConfirmForm>
  );
}
