import { ApiError } from "@/app/lib/api-error";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { AgentEmployeeOffCards } from "@/components/features/off-days/agent-employee-off-cards";
import { EmployeeOffDayCards } from "@/components/features/off-days/employee-off-day-cards";
import { MonthNav, OffDayCalendar } from "@/components/features/off-days/off-day-calendar";
import { RemoveOffDayButton } from "@/components/features/off-days/off-day-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAgentOffBranches, type AgentOffBranch } from "@/lib/agent-off-days";
import { getMyOffDays } from "@/lib/api/off-day";
import { formatNumber } from "@/lib/format";
import { groupByEmployee, monthLabel, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first } from "@/lib/search-params";

/** The agent's employees at one branch, each ready to be given a day off, beside that branch's calendar. */
export default async function AgentBranchOffDaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("offday:manage");

  if (session.agentId === null) {
    return (
      <>
        <PageHeader title="Off Days" />
        <EmptyState symbol="link_off" title="Account not linked" description="Your login is not linked to an agent record. Contact the company's administrators." />
      </>
    );
  }

  const branchId = Number((await params).id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  const month = parseMonth(first((await searchParams).month));

  let data: { branches: AgentOffBranch[]; offDays: Awaited<ReturnType<typeof getMyOffDays>> };
  try {
    const offDays = await getMyOffDays(monthRange(month));
    data = { branches: await getAgentOffBranches(offDays), offDays };
  } catch (error) {
    return <DataUnavailable title="Off Days" subject="Your employees' off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const { branches } = data;
  const branch = branches.find((candidate) => candidate.id === branchId);
  if (!branch) notFound();
  if (branch.employees === null) {
    return <DataUnavailable title="Off Days" subject="Your employees at this branch" />;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const offDays = data.offDays.filter((offDay) => offDay.branchId === branchId);
  const employees = branch.employees;

  // Someone no longer active has no Give Off button, but an off day still ahead can be removed.
  const activeIds = new Set(employees.map((person) => person.id));
  const others = groupByEmployee(offDays.filter((offDay) => !activeIds.has(offDay.employeeId)), month);
  const groups = groupByEmployee(offDays, month);
  const totalDays = groups.reduce((sum, group) => sum + group.totalDays, 0);

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            {branches.length > 1 ? (
              <Link
                href={buildHref("/agent/off-days", { month })}
                aria-label="Back to your branches"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
              >
                <Icon name="arrow_back" />
              </Link>
            ) : null}
            <span className="min-w-0 break-words">{branch.name}</span>
          </span>
        }
        description="Off Days at this branch. The Admin can see them too."
        actions={<MonthNav month={month} hrefFor={(target) => buildHref(`/agent/off-days/branches/${branchId}`, { month: target })} />}
      />

      <div className="mb-gutter grid grid-cols-2 gap-gutter">
        <MetricCard label="Employees off" value={formatNumber(groups.length)} icon="group" hint={monthLabel(month)} />
        <MetricCard label="Days off" value={formatNumber(totalDays)} icon="event_busy" tone="tertiary" hint={monthLabel(month)} />
      </div>

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-gutter xl:col-span-5">
          <AgentEmployeeOffCards employees={employees} offDays={offDays} month={month} today={today} />
          {others.length > 0 ? (
            <section aria-labelledby="off-days-others" className="flex flex-col gap-3">
              <h2 id="off-days-others" className="font-table-header text-table-header uppercase text-outline">No longer active</h2>
              <EmployeeOffDayCards
                groups={others}
                showAgent={false}
                showBranch={false}
                action={(offDay) => (offDay.endDate >= today ? <RemoveOffDayButton id={offDay.id} /> : null)}
              />
            </section>
          ) : null}
        </div>
        <div className="min-w-0 xl:col-span-7">
          <OffDayCalendar month={month} offDays={offDays} showBranch={false} showAgent={false} />
        </div>
      </div>
    </>
  );
}
