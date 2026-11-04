import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchOffCards } from "@/components/features/off-days/branch-off-cards";
import { MonthNav } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getOffDays } from "@/lib/api/off-day";
import { formatNumber } from "@/lib/format";
import { branchOffSummary, groupByEmployee, monthLabel, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first, parseId } from "@/lib/search-params";

/** Off days by branch: a card per branch, each opening that branch's calendar. */
export default async function AdminOffDaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("offday:read");

  const params = await searchParams;
  const month = parseMonth(first(params.month));
  const oldBranchLink = parseId(first(params.branch));

  // Links written before off days moved inside each branch.
  if (oldBranchLink !== undefined) {
    redirect(buildHref(`/admin/off-days/branches/${oldBranchLink}`, { month }));
  }

  let data: { branches: Awaited<ReturnType<typeof getBranches>>; offDays: Awaited<ReturnType<typeof getOffDays>> };
  try {
    const [branches, offDays] = await Promise.all([getBranches(), getOffDays(monthRange(month))]);
    data = { branches, offDays };
  } catch (error) {
    return <DataUnavailable title="Off Days" subject="The off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const groups = groupByEmployee(data.offDays, month);
  const totalDays = groups.reduce((sum, group) => sum + group.totalDays, 0);

  const items = data.branches
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      status: branch.status,
      summary: branchOffSummary(data.offDays.filter((offDay) => offDay.branchId === branch.id), month, today),
      href: buildHref(`/admin/off-days/branches/${branch.id}`, { month }),
    }))
    // A closed branch only earns a card while it still has someone off.
    .filter((item) => item.status === "ACTIVE" || item.summary.employeesOff > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Off Days"
        description="Open a branch to see its employees on the calendar."
        actions={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <MonthNav month={month} hrefFor={(target) => buildHref("/admin/off-days", { month: target })} />
            <Link
              href={buildHref("/admin/off-days/calendar", { month })}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low sm:w-auto"
            >
              <Icon name="calendar_month" className="text-[18px]" />
              All branches
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-2 gap-gutter">
          <MetricCard label="Employees off" value={formatNumber(groups.length)} icon="group" hint={monthLabel(month)} />
          <MetricCard label="Days off" value={formatNumber(totalDays)} icon="event_busy" tone="tertiary" hint={monthLabel(month)} />
        </div>

        <BranchOffCards items={items} emptyDescription="Branches appear here once they have been created." />
      </div>
    </>
  );
}
