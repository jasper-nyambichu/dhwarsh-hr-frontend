import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeOffDayCards } from "@/components/features/off-days/employee-off-day-cards";
import { MonthNav, OffDayCalendar } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { FilterSelect } from "@/components/shared/filter-select";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranch } from "@/lib/api/branch";
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

/** One branch's off days on the month calendar, reached from the Off Days branch cards. */
export default async function AdminBranchOffDaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("offday:read");

  const branchId = Number((await params).id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  const query = await searchParams;
  const month = parseMonth(first(query.month));
  const employee = parseId(first(query.employee));
  const agent = parseId(first(query.agent));

  let data: { branch: Awaited<ReturnType<typeof getBranch>>; offDays: Awaited<ReturnType<typeof getOffDays>> };
  try {
    const [branch, offDays] = await Promise.all([getBranch(branchId), getOffDays(monthRange(month))]);
    data = { branch, offDays: offDays.filter((offDay) => offDay.branchId === branchId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <DataUnavailable title="Branch off days" subject="This branch's off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const path = `/admin/off-days/branches/${branchId}`;
  const shown = data.offDays.filter(
    (row) => (employee === undefined || row.employeeId === employee) && (agent === undefined || row.agentId === agent),
  );
  const groups = groupByEmployee(shown, month);
  const totalDays = groups.reduce((sum, group) => sum + group.totalDays, 0);
  const hasFilters = employee !== undefined || agent !== undefined;

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href={buildHref("/admin/off-days", { month })}
              aria-label="Back to all branches"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{data.branch.name}</span>
          </span>
        }
        description="Who is off at this branch, day by day."
        actions={<MonthNav month={month} hrefFor={(target) => buildHref(path, { month: target, employee, agent })} />}
      />

      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-2 gap-gutter">
          <MetricCard label="Employees off" value={formatNumber(groups.length)} icon="group" hint={monthLabel(month)} />
          <MetricCard label="Days off" value={formatNumber(totalDays)} icon="event_busy" tone="tertiary" hint={monthLabel(month)} />
        </div>

        {data.offDays.length > 0 ? (
          <form method="get" action={path} className="bento-card grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
            <input type="hidden" name="month" value={month} />
            <FilterSelect
              name="employee"
              label="Employee"
              defaultValue={employee ? String(employee) : ""}
              options={[{ value: "", label: "All employees" }, ...options(data.offDays.map((row) => ({ id: row.employeeId, label: row.employeeName })))]}
            />
            <FilterSelect
              name="agent"
              label="Agent"
              defaultValue={agent ? String(agent) : ""}
              options={[{ value: "", label: "All agents" }, ...options(data.offDays.map((row) => ({ id: row.agentId, label: row.agentName })))]}
            />
            <div className="flex gap-2">
              <button type="submit" className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-container">
                Apply
              </button>
              {hasFilters ? (
                <Link href={buildHref(path, { month })} className="flex h-10 items-center rounded-lg border border-outline-variant px-3 text-sm text-on-surface-variant hover:bg-surface-container-low">
                  Reset
                </Link>
              ) : null}
            </div>
          </form>
        ) : null}

        <OffDayCalendar month={month} offDays={shown} showBranch={false} />

        {groups.length > 0 ? (
          <section aria-labelledby="off-days-by-employee" className="flex flex-col gap-3">
            <h2 id="off-days-by-employee" className="font-table-header text-table-header uppercase text-outline">By employee</h2>
            <EmployeeOffDayCards groups={groups} showBranch={false} />
          </section>
        ) : null}
      </div>
    </>
  );
}
