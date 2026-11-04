import { ApiError } from "@/app/lib/api-error";
import { format } from "date-fns";
import { redirect } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { BranchOffCards } from "@/components/features/off-days/branch-off-cards";
import { MonthNav } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAgentOffBranches, type AgentOffBranch } from "@/lib/agent-off-days";
import { getMyOffDays } from "@/lib/api/off-day";
import { branchOffSummary, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first } from "@/lib/search-params";

/** The agent starts from the branches their employees work at. */
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

  let data: { branches: AgentOffBranch[]; offDays: Awaited<ReturnType<typeof getMyOffDays>> };
  try {
    const offDays = await getMyOffDays(monthRange(month));
    data = { branches: await getAgentOffBranches(offDays), offDays };
  } catch (error) {
    return <DataUnavailable title="Off Days" subject="Your employees' off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const { branches } = data;

  // Nothing to choose between, so go straight to the employees.
  if (branches.length === 1 && branches[0].employees !== null) {
    redirect(buildHref(`/agent/off-days/branches/${branches[0].id}`, { month }));
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const items = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    code: branch.code,
    status: branch.status,
    employeeCount: branch.employees?.length,
    summary: branchOffSummary(data.offDays.filter((offDay) => offDay.branchId === branch.id), month, today),
    href: buildHref(`/agent/off-days/branches/${branch.id}`, { month }),
  }));

  return (
    <>
      <PageHeader
        title="Off Days"
        description="Choose a branch, then give your employees there their days off."
        actions={<MonthNav month={month} hrefFor={(target) => buildHref("/agent/off-days", { month: target })} />}
      />
      <BranchOffCards items={items} emptyDescription="You have no active employees yet. Their branches appear here once you have some." />
    </>
  );
}
