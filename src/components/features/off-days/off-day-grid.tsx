"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export type OffDayGridPerson = { id: number; name: string; detail: string; reason: string | null };

export type OffDayGridCell = {
  key: string;
  /** "4" */
  day: string;
  /** "Wednesday, 04 November 2026" */
  longDate: string;
  inMonth: boolean;
  isToday: boolean;
  people: OffDayGridPerson[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Names that fit inside a day on a wide screen; the pop-up card always has everyone. */
const NAMES_IN_CELL = 2;

/**
 * The month's days, Monday first. A day with someone off can be clicked: a card pops up with the name of every
 * employee off that day (number, branch, agent, reason), and an × to close it. A phone shows a count in each day, a
 * wide screen the first names.
 */
export function OffDayGrid({ cells }: { cells: OffDayGridCell[] }) {
  const [open, setOpen] = useState<OffDayGridCell | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  return (
    <>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-outline-variant/40 bg-outline-variant/40">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="bg-surface-container-low px-0.5 py-2 text-center font-table-header text-[10px] uppercase text-outline sm:text-table-header">
            {weekday}
          </div>
        ))}

        {cells.map((cell) => {
          const extra = cell.people.length - NAMES_IN_CELL;
          const content = (
            <>
              <span className="flex flex-col items-center gap-1 lg:flex-row lg:justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    cell.isToday ? "bg-primary text-on-primary" : cell.inMonth ? "text-on-surface" : "text-outline/50",
                  )}
                >
                  {cell.day}
                </span>
                {cell.people.length > 0 ? (
                  <span className="rounded-full bg-primary-container px-1.5 text-[10px] font-bold tabular-nums text-on-primary lg:hidden">
                    {cell.people.length}
                  </span>
                ) : null}
              </span>
              {cell.people.length > 0 ? (
                <span className="mt-1 hidden min-w-0 flex-col gap-0.5 lg:flex">
                  {cell.people.slice(0, NAMES_IN_CELL).map((person) => (
                    <span key={person.id} className="truncate rounded bg-primary-container/10 px-1.5 py-0.5 text-left text-[11px] font-medium text-primary-container">
                      {person.name}
                    </span>
                  ))}
                  {extra > 0 ? <span className="px-1.5 text-left text-[10px] text-on-surface-variant">+{extra} more</span> : null}
                </span>
              ) : null}
            </>
          );
          const cellClass = cn(
            "block min-h-16 min-w-0 p-1 text-left sm:p-1.5 lg:min-h-28",
            cell.inMonth ? "bg-surface-container-lowest" : "bg-surface-container-low/60",
          );

          return cell.people.length > 0 ? (
            <button data-live=""
              key={cell.key}
              type="button"
              onClick={() => setOpen(cell)}
              aria-label={`${cell.longDate}: ${cell.people.length} off. Show who`}
              className={cn(cellClass, "w-full cursor-pointer transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary")}
            >
              {content}
            </button>
          ) : (
            <div key={cell.key} className={cellClass}>{content}</div>
          );
        })}
      </div>

      {open ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="off-day-card-title"
          onClose={() => setOpen(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialogRef.current?.close();
          }}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-ambient-3 backdrop:bg-primary/60 backdrop:backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-outline">Off on</p>
                <h2 id="off-day-card-title" className="break-words text-xl font-bold text-on-primary-fixed">{open.longDate}</h2>
                <p className="text-sm text-on-surface-variant">
                  {open.people.length} employee{open.people.length === 1 ? "" : "s"} off
                </p>
              </div>
              <button data-live=""
                type="button"
                aria-label="Close"
                onClick={() => dialogRef.current?.close()}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
              >
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>

            <ul className="flex flex-col divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/40">
              {open.people.map((person) => (
                <li key={person.id} className="flex min-w-0 items-start gap-3 p-3">
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
                    {initials(person.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words font-semibold text-on-surface">{person.name}</span>
                    <span className="block break-words text-xs text-on-surface-variant">{person.detail || "—"}</span>
                    {person.reason ? <span className="mt-0.5 block break-words text-xs text-on-surface">Reason: {person.reason}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
