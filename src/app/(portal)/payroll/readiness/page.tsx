import Link from "next/link";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getDaysWorked } from "@/lib/api/days-worked";
import { formatDate, formatNumber } from "@/lib/format";
import { first, parseDate } from "@/lib/search-params";

const FIELD =
  "min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary md:text-sm";

type Readiness = "READY" | "PARTLY" | "OPEN" | "EMPTY" | "ERROR";

type BranchCard = {
  id: number;
  name: string;
  state: Readiness;
  employees: number;
  locked: number;
  days: number;
  lockedAt: string | null;
  error?: string;
};

const STATE_STYLE: Record<Readiness, { label: string; chip: string; hint: string }> = {
  READY: {
    label: "Locked",
    chip: "bg-primary/10 text-primary",
    hint: "Every employee's days are locked. This branch is ready for payroll.",
  },
  PARTLY: {
    label: "Partly locked",
    chip: "bg-error/10 text-error",
    hint: "Some employees were added after the lock. Ask the Back Office to unlock and lock again, or payroll will be refused.",
  },
  OPEN: {
    label: "Not locked",
    chip: "bg-error/10 text-error",
    hint: "The Back Office has not locked this branch's days yet. Payroll will be refused until they do.",
  },
  EMPTY: {
    label: "No employees",
    chip: "bg-surface-container-low text-on-surface-variant",
    hint: "This branch has no active employees, so there is nothing to lock.",
  },
  ERROR: {
    label: "Couldn't load",
    chip: "bg-error/10 text-error",
    hint: "The figures for this branch could not be loaded.",
  },
};

const ORDER: Record<Readiness, number> = { ERROR: 0, OPEN: 1, PARTLY: 2, READY: 3, EMPTY: 4 };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-outline">{label}</dt>
      <dd className="text-base font-semibold tabular-nums text-on-surface">{value}</dd>
    </div>
  );
}

/** Which branches have their days locked for a pay period — check this before running payroll. */
export default async function PayrollReadinessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("dayswork:read");

  const params = await searchParams;
  const today = new Date();
  const start = parseDate(first(params.start)) ?? format(startOfMonth(today), "yyyy-MM-dd");
  const end = parseDate(first(params.end)) ?? format(endOfMonth(today), "yyyy-MM-dd");

  const spanDays = differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
  const periodProblem =
    spanDays < 1
      ? "The last day can't be before the first day."
      : spanDays > 31
        ? "A pay period can be at most 31 days."
        : null;

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return (
      <DataUnavailable
        title="Period readiness"
        subject="The branch list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const activeBranches = branches.filter((branch) => branch.status === "ACTIVE");

  let cards: BranchCard[] = [];
  if (!periodProblem) {
    const settled = await Promise.allSettled(activeBranches.map((branch) => getDaysWorked(branch.id, start, end)));

    cards = activeBranches
      .map((branch, index): BranchCard => {
        const result = settled[index];

        if (result.status === "rejected") {
          return {
            id: branch.id,
            name: branch.name,
            state: "ERROR",
            employees: 0,
            locked: 0,
            days: 0,
            lockedAt: null,
            error: result.reason instanceof ApiError ? result.reason.message : undefined,
          };
        }

        const rows = result.value;
        const locked = rows.filter((row) => row.locked).length;
        const state: Readiness =
          rows.length === 0 ? "EMPTY" : locked === rows.length ? "READY" : locked === 0 ? "OPEN" : "PARTLY";

        return {
          id: branch.id,
          name: branch.name,
          state,
          employees: rows.length,
          locked,
          days: rows.reduce((sum, row) => sum + row.daysWorked, 0),
          lockedAt: rows.find((row) => row.locked)?.lockedAt ?? null,
        };
      })
      .sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.name.localeCompare(b.name));
  }

  const withStaff = cards.filter((card) => card.state !== "EMPTY");
  const blocking = withStaff.filter((card) => card.state !== "READY");
  const allReady = withStaff.length > 0 && blocking.length === 0;
  const totalLockedDays = cards.filter((card) => card.state === "READY").reduce((sum, card) => sum + card.days, 0);

  return (
    <>
      <PageHeader
        title="Period readiness"
        description="Payroll only pays days the Back Office has locked, for exactly the period you run. Check every branch here first."
      />

      <form
        method="get"
        action="/payroll/readiness"
        className="mb-4 flex flex-col gap-3 rounded-card bg-surface-container-lowest p-3 shadow-ambient-1 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="flex flex-col gap-1 text-xs text-outline">
          From
          <input type="date" name="start" defaultValue={start} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-outline">
          To
          <input type="date" name="end" defaultValue={end} className={FIELD} />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container sm:flex-none"
          >
            Check period
          </button>
          <Link
            href="/payroll/readiness"
            className="flex min-h-11 items-center rounded-lg border border-outline-variant px-4 text-sm text-on-surface-variant hover:bg-surface-container-low"
          >
            This month
          </Link>
        </div>
      </form>

      {periodProblem ? (
        <p role="alert" className="mb-4 rounded-card bg-error/10 p-3 text-sm text-error">
          {periodProblem}
        </p>
      ) : cards.length === 0 ? (
        <EmptyState
          symbol="store"
          title="No active branches"
          description="Add a branch first; each branch's days are locked separately."
        />
      ) : (
        <>
          <div
            role="status"
            className={`mb-4 flex flex-col gap-3 rounded-card p-4 sm:flex-row sm:items-center sm:justify-between ${
              allReady ? "bg-primary/10" : "bg-error/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`material-symbols-outlined text-3xl ${allReady ? "text-primary" : "text-error"}`}
              >
                {allReady ? "check_circle" : "warning"}
              </span>
              <div>
                <p className="font-semibold text-on-surface">
                  {allReady
                    ? "Every branch is locked — you can run payroll for this period."
                    : withStaff.length === 0
                      ? "No branch has employees to pay for this period."
                      : `${blocking.length} of ${withStaff.length} branch${withStaff.length === 1 ? "" : "es"} still need${blocking.length === 1 ? "s" : ""} locking.`}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {formatDate(start)} to {formatDate(end)}
                  {allReady ? ` · ${formatNumber(totalLockedDays)} days locked in total` : ""}
                </p>
              </div>
            </div>
            {allReady ? (
              <Link
                href="/payroll/runs"
                className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Go to payroll runs
              </Link>
            ) : null}
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const style = STATE_STYLE[card.state];
              return (
                <li key={card.id} className="rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate font-semibold text-on-surface">{card.name}</h2>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}>
                      {style.label}
                    </span>
                  </div>

                  {card.state !== "ERROR" && card.state !== "EMPTY" ? (
                    <dl className="mt-3 grid grid-cols-3 gap-3">
                      <Stat label="Employees" value={formatNumber(card.employees)} />
                      <Stat label="Locked" value={`${formatNumber(card.locked)}/${formatNumber(card.employees)}`} />
                      <Stat label={card.state === "READY" ? "Days" : "Days so far"} value={formatNumber(card.days)} />
                    </dl>
                  ) : null}

                  <p className="mt-3 text-xs text-on-surface-variant">{card.error ?? style.hint}</p>
                  {card.lockedAt ? (
                    <p className="mt-1 text-xs text-outline">Locked {formatDate(card.lockedAt.slice(0, 10))}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs text-on-surface-variant">
            When you run payroll, use exactly {formatDate(start)} to {formatDate(end)}. A different date range has no
            locked days and will be refused.
          </p>
        </>
      )}
    </>
  );
}