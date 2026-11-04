"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { DateInput } from "@/components/shared/date-input";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { AttendanceBranchSummary } from "@/types";

/**
 * Branch and date filters for the attendance board.
 *
 * Navigates rather than holding local state, so the filtered view stays a URL:
 * shareable, survives a refresh, and the back button steps through filter
 * changes. This is the same contract `FilterTabs` documents, for the two
 * filters a segmented row of links cannot carry (a branch list is too long, and
 * a date is not enumerable).
 *
 * The current values arrive as props from the Server Component instead of being
 * read back out of `useSearchParams`. The page already has them — it awaits
 * `searchParams` to run its queries — and rebuilding the query string from props
 * keeps this component free of a Suspense boundary requirement.
 *
 * `basePath` is a prop because two boards render this: the admin one at
 * `/admin/attendance` and the HR one at `/hr/attendance`. Both read the same
 * endpoints and offer the same filters, so the only thing that differs is where
 * a change navigates to.
 */

export function AttendanceFilters({
  branches,
  branchId,
  date,
  filter,
  basePath = "/admin/attendance",
  showBranch = true,
  clearable = false,
  className,
}: {
  branches: readonly AttendanceBranchSummary[];
  /** `undefined` means all branches. */
  branchId?: number;
  /** The business day being viewed, `yyyy-MM-dd`. */
  date: string;
  /** Preserved across a filter change — the open-only tab is not a filter reset. */
  filter?: string;
  /** Where a filter change navigates to. Defaults to the admin board. */
  basePath?: string;
  /** Off where branches are chosen some other way. */
  showBranch?: boolean;
  /** Offers Clear even with no other filter, such as when looking at a past date. */
  clearable?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const hasFilter = Boolean(branchId) || Boolean(filter) || clearable;

  function navigate(next: { branchId?: number; date?: string }) {
    const params = new URLSearchParams();

    const nextBranchId = next.branchId ?? branchId;
    const nextDate = next.date ?? date;

    if (nextBranchId) params.set("branchId", String(nextBranchId));
    if (nextDate) params.set("date", nextDate);
    if (filter) params.set("filter", filter);
    // No `page`: page 3 of the unfiltered list is not a sensible landing spot
    // for a different branch or day.

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath);
    });
  }

  return (
    <div
      data-live-region
      className={cn(
        "flex flex-wrap items-center gap-2",
        isPending && "opacity-60",
        className,
      )}
    >
      {showBranch ? (
      <label className="relative flex items-center">
        <span className="sr-only">Filter by branch</span>
        <Icon
          name="account_balance"
          className="pointer-events-none absolute left-2.5 text-[18px] text-primary"
        />
        <select
          value={branchId ?? ""}
          onChange={(event) =>
            navigate({
              branchId: event.target.value ? Number(event.target.value) : undefined,
            })
          }
          className="appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-1.5 pl-9 pr-8 font-body-md text-body-md text-on-surface transition-colors hover:bg-surface-container-low focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch.branchId} value={branch.branchId}>
              {branch.branchName}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-2 text-[18px] text-outline"
        />
      </label>
      ) : null}

      <DateInput
        aria-label="Attendance date"
        value={date}
        onChange={(next) => navigate({ date: next })}
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-body-md text-body-md text-on-surface transition-colors hover:bg-surface-container-low focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
      />

      {hasFilter ? (
        <Link
          href={basePath}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Icon name="close" className="text-[18px]" />
          Clear
        </Link>
      ) : null}
    </div>
  );
}
