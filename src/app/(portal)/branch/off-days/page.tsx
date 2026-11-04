import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { MonthNav, OffDayCalendar } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyBranchOffDays } from "@/lib/api/off-day";
import { formatNumber } from "@/lib/format";
import { groupByEmployee, monthLabel, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first } from "@/lib/search-params";

/** Dashboard → Off List: the whole month, showing which of the branch's employees are off on which days. */
export default async function BranchOffDaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("offday:read:branch");

  const month = parseMonth(first((await searchParams).month));

  let offDays: Awaited<ReturnType<typeof getMyBranchOffDays>>;
  try {
    offDays = await getMyBranchOffDays(monthRange(month));
  } catch (error) {
    return <DataUnavailable title="Off List" subject="The off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const groups = groupByEmployee(offDays, month);
  const totalDays = groups.reduce((sum, group) => sum + group.totalDays, 0);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/branch/dashboard"
              aria-label="Back to dashboard"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            Off List
          </span>
        }
        actions={<MonthNav month={month} hrefFor={(target) => buildHref("/branch/off-days", { month: target })} />}
      />
      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-2 gap-gutter">
          <MetricCard label="Employees off" value={formatNumber(groups.length)} icon="group" hint={monthLabel(month)} />
          <MetricCard label="Days off" value={formatNumber(totalDays)} icon="event_busy" tone="tertiary" hint={monthLabel(month)} />
        </div>
        <OffDayCalendar month={month} offDays={offDays} />
      </div>
    </>
  );
}
