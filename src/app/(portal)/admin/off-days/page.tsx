import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeOffDayCards } from "@/components/features/off-days/employee-off-day-cards";
import { MonthNav } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getOffDays } from "@/lib/api/off-day";
import { formatNumber } from "@/lib/format";
import { groupByEmployee, monthLabel, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first, parseId } from "@/lib/search-params";

/** Unique id and label pairs, by label, for a filter dropdown. */
function options(rows: { id: number | null; label: string | null }[]): { value: string; label: string }[] {
  const unique = new Map<number, string>();
  for (const row of rows) {
    if (row.id !== null && row.label) unique.set(row.id, row.label);
  }
  return [...unique.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([id, label]) => ({ value: String(id), label }));
}

/** The days agents gave employees off in a month, per employee. */
export default async function AdminOffDaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("offday:read");

  const params = await searchParams;
  const month = parseMonth(first(params.month));
  const employee = parseId(first(params.employee));
  const branch = parseId(first(params.branch));
  const agent = parseId(first(params.agent));

  let offDays: Awaited<ReturnType<typeof getOffDays>>;
  try {
    offDays = await getOffDays(monthRange(month));
  } catch (error) {
    return <DataUnavailable title="Off Days" subject="The off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const shown = offDays.filter(
    (row) =>
      (employee === undefined || row.employeeId === employee) &&
      (branch === undefined || row.branchId === branch) &&
      (agent === undefined || row.agentId === agent),
  );
  const groups = groupByEmployee(shown, month);
  const totalDays = groups.reduce((sum, group) => sum + group.totalDays, 0);
  const filters = { month, employee, branch, agent };
  const hasFilters = employee !== undefined || branch !== undefined || agent !== undefined;

  return (
    <>
      <PageHeader
        title="Off Days"
        description="The days agents have given their employees off."
        actions={
          <Link
            href={buildHref("/admin/off-days/calendar", { month })}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            <Icon name="calendar_month" className="text-[18px]" />
            Month Calendar
          </Link>
        }
      />

      <div className="flex flex-col gap-gutter">
        <div className="bento-card flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <MonthNav month={month} hrefFor={(target) => buildHref("/admin/off-days", { ...filters, month: target })} />
          <form method="get" action="/admin/off-days" className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="month" value={month} />
            <FilterSelect
              name="employee"
              label="Employee"
              defaultValue={employee ? String(employee) : ""}
              options={[{ value: "", label: "All employees" }, ...options(offDays.map((row) => ({ id: row.employeeId, label: row.employeeName })))]}
            />
            <FilterSelect
              name="branch"
              label="Branch"
              defaultValue={branch ? String(branch) : ""}
              options={[{ value: "", label: "All branches" }, ...options(offDays.map((row) => ({ id: row.branchId, label: row.branchName })))]}
            />
            <FilterSelect
              name="agent"
              label="Agent"
              defaultValue={agent ? String(agent) : ""}
              options={[{ value: "", label: "All agents" }, ...options(offDays.map((row) => ({ id: row.agentId, label: row.agentName })))]}
            />
            <div className="flex gap-2">
              <button type="submit" className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-container">
                Apply
              </button>
              {hasFilters ? (
                <Link href={buildHref("/admin/off-days", { month })} className="flex h-10 items-center rounded-lg border border-outline-variant px-3 text-sm text-on-surface-variant hover:bg-surface-container-low">
                  Reset
                </Link>
              ) : null}
            </div>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <MetricCard label="Employees given off" value={formatNumber(groups.length)} icon="group" hint={monthLabel(month)} />
          <MetricCard label="Days off" value={formatNumber(totalDays)} icon="event_busy" tone="tertiary" hint={monthLabel(month)} />
        </div>

        {groups.length === 0 ? (
          <div className="bento-card p-4 sm:p-card-padding">
            <EmptyState
              symbol="event_available"
              title={hasFilters ? "No off days match" : "No off days this month"}
              description={hasFilters ? "Try clearing a filter." : "Days an agent gives an employee off appear here."}
            />
          </div>
        ) : (
          <EmployeeOffDayCards groups={groups} />
        )}
      </div>
    </>
  );
}
