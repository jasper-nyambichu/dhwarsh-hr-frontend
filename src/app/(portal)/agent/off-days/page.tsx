import { format } from "date-fns";

import { requirePermission } from "@/app/lib/dal";
import { EmployeeOffDayCards } from "@/components/features/off-days/employee-off-day-cards";
import { MonthNav, OffDayCalendar } from "@/components/features/off-days/off-day-calendar";
import { OffDayForm, RemoveOffDayButton } from "@/components/features/off-days/off-day-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAgentStaff } from "@/lib/api/agent";
import { getMyOffDays } from "@/lib/api/off-day";
import { groupByEmployee, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first } from "@/lib/search-params";

/** The agent gives their own employees days off and sees them on the month calendar. */
export default async function AgentOffDaysPage({
  searchParams,
}: {
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

  const month = parseMonth(first((await searchParams).month));

  let data: { staff: Awaited<ReturnType<typeof getAgentStaff>>; offDays: Awaited<ReturnType<typeof getMyOffDays>> };
  try {
    const [staff, offDays] = await Promise.all([getAgentStaff(session.agentId), getMyOffDays(monthRange(month))]);
    data = { staff, offDays };
  } catch (error) {
    return <DataUnavailable title="Off Days" subject="Your employees' off days" reason={error instanceof Error ? error.message : undefined} />;
  }

  const employees = data.staff
    .filter((person) => person.employmentStatus === "ACTIVE")
    .map((person) => ({ id: person.id, name: `${person.fullName} (${person.employeeNumber})` }));
  const groups = groupByEmployee(data.offDays, month);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <PageHeader
        title="Off Days"
        description="Give your employees days off. The Admin can see them too."
        actions={<MonthNav month={month} hrefFor={(target) => buildHref("/agent/off-days", { month: target })} />}
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <OffDayForm employees={employees} />
        </div>
        <div className="min-w-0 lg:col-span-8">
          <OffDayCalendar month={month} offDays={data.offDays} />
        </div>
      </div>

      {groups.length > 0 ? (
        <section aria-labelledby="off-days-by-employee" className="mt-gutter flex flex-col gap-3">
          <h2 id="off-days-by-employee" className="font-table-header text-table-header uppercase text-outline">By employee</h2>
          <EmployeeOffDayCards
            groups={groups}
            showAgent={false}
            action={(offDay) => (offDay.endDate >= today ? <RemoveOffDayButton id={offDay.id} /> : null)}
          />
        </section>
      ) : null}
    </>
  );
}
