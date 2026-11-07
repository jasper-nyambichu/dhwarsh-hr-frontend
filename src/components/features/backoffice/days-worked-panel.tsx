import Link from "next/link";
import { endOfMonth, format, startOfMonth } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getDaysWorked } from "@/lib/api/days-worked";
import { formatDate, formatNumber } from "@/lib/format";
import { DateInput } from "@/components/shared/date-input";
import { Icon } from "@/components/ui/icon";
import { buildHref, first, parseDate, parseId } from "@/lib/search-params";
import type { DaysWorkedResponse } from "@/types/backoffice";

const FIELD =
  "min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary md:text-sm";

/**
 * Days worked per branch for a pay period, counted live from attendance. Nothing needs locking:
 * the agent payment calculation reads the same count whenever the Admin runs it.
 */
export async function DaysWorkedPanel({
  params,
  basePath,
}: {
  params: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  await requirePermission("dayswork:read");

  const today = new Date();
  const branchId = parseId(first(params.branchId));
  const start = parseDate(first(params.start)) ?? format(startOfMonth(today), "yyyy-MM-dd");
  const end = parseDate(first(params.end)) ?? format(endOfMonth(today), "yyyy-MM-dd");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  let rows: DaysWorkedResponse[] = [];
  try {
    branches = await getBranches();
    if (branchId) rows = await getDaysWorked(branchId, start, end);
  } catch (error) {
    return (
      <DataUnavailable
        title="Days worked"
        subject="The days-worked figures"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const totalDays = rows.reduce((sum, row) => sum + row.daysWorked, 0);
  const branchName = branches.find((branch) => branch.id === branchId)?.name;

  return (
    <>
      <PageHeader
        title="Days worked"
        description="The days each employee clocked in, counted from attendance. Agent payments use these figures whenever the Admin calculates."
      />

      {first(params.returnTo) === "payments" ? (
        <Link
          href={`${buildHref("/admin/pay-settings", { periodStart: start, periodEnd: end })}#calculate`}
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to Calculate Agent Payments
        </Link>
      ) : null}

      <form
        method="get"
        action={basePath}
        className="mb-4 flex flex-col gap-3 rounded-card bg-surface-container-lowest p-3 shadow-ambient-1 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="flex flex-col gap-1 text-xs text-outline">
          Branch
          <select name="branchId" defaultValue={branchId ?? ""} className={FIELD}>
            <option value="">Choose a branch…</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs text-outline">
          <span>From</span>
          <DateInput name="start" defaultValue={start} aria-label="From" className={FIELD} />
        </div>
        <div className="flex flex-col gap-1 text-xs text-outline">
          <span>To</span>
          <DateInput name="end" defaultValue={end} aria-label="To" className={FIELD} />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container sm:flex-none"
          >
            Show
          </button>
          <Link
            href={basePath}
            className="flex min-h-11 items-center rounded-lg border border-outline-variant px-4 text-sm text-on-surface-variant hover:bg-surface-container-low"
          >
            Reset
          </Link>
        </div>
      </form>

      {!branchId ? (
        <EmptyState
          symbol="date_range"
          title="Choose a branch"
          description="Pick a branch and a pay period to see how many days each employee reported."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          symbol="group_off"
          title="No active employees"
          description="This branch has no active employees for the period."
        />
      ) : (
        <BentoCard
          title={`${branchName ?? "Branch"} · ${formatDate(start)} to ${formatDate(end)}`}
          subtitle={`${formatNumber(totalDays)} days across ${rows.length} employees`}
        >

          {/* Phones: one card per employee */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.employeeId} className="rounded-lg border border-outline-variant/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">{row.employeeName}</p>
                    <p className="font-mono text-[11px] text-outline">{row.employeeNumber ?? ""}</p>
                  </div>
                  <p className="shrink-0 text-xl font-bold tabular-nums text-on-surface">{row.daysWorked}</p>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">From attendance: {row.systemDays}</p>
                {row.adjusted ? (
                  <p className="mt-2 rounded-lg bg-surface-container-low p-2 text-xs text-on-surface-variant">
                    Adjusted: {row.adjustmentReason ?? "no reason recorded"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {/* Tablets and desktops: a table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="data-table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">From attendance</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Days worked</th>
                  <th className="pb-3 pl-4 pr-2 font-table-header text-table-header uppercase text-outline">Adjustment</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {rows.map((row) => (
                  <tr key={row.employeeId} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 pl-2">
                      <span className="block font-semibold">{row.employeeName}</span>
                      <span className="block font-mono text-[11px] text-outline">{row.employeeNumber ?? ""}</span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">{row.systemDays}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{row.daysWorked}</td>
                    <td className="py-3 pl-4 pr-2 text-sm text-on-surface-variant">
                      {row.adjusted ? row.adjustmentReason ?? "Adjusted" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}
    </>
  );
}