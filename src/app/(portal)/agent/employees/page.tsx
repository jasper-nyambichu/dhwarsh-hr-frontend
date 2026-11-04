import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayMetrics, PeriodPicker } from "@/components/features/agents/employee-pay";
import { BranchCards, existingEmployees } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { choosePeriod, inPeriod, payPeriods, payTotals } from "@/lib/agent-pay";
import { getBranches } from "@/lib/api/branch";
import { getMyBranchDirectory } from "@/lib/api/employee";
import { getMyAgentPayslips } from "@/lib/api/payslip";
import { formatMoney } from "@/lib/format";
import { buildHref, first } from "@/lib/search-params";

/** The agent's employees, starting from the branches they work at, with what they should receive. */
export default async function AgentEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("agent:read:self");

  if (session.agentId === null) {
    return (
      <>
        <PageHeader title="Employees" />
        <EmptyState symbol="link_off" title="Account not linked" description="Your login is not linked to an agent record. Contact an administrator." />
      </>
    );
  }

  const requested = first((await searchParams).period);

  let data: { branches: Awaited<ReturnType<typeof getBranches>>; payslips: Awaited<ReturnType<typeof getMyAgentPayslips>> };
  try {
    const [branches, payslips] = await Promise.all([getBranches(), getMyAgentPayslips()]);
    data = { branches, payslips };
  } catch (error) {
    return <DataUnavailable title="Employees" subject="Your employees" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const lists = await Promise.allSettled(data.branches.map((branch) => getMyBranchDirectory(branch.id)));
  const periods = payPeriods(data.payslips);
  const period = choosePeriod(periods, requested);
  const shown = inPeriod(data.payslips, period);

  const items = data.branches.map((branch, index) => {
    const list = lists[index];
    if (list?.status !== "fulfilled") return { branch, employeeCount: null };
    const ids = new Set(list.value.map((person) => person.id));
    const due = payTotals(shown.filter((payslip) => ids.has(payslip.employeeId))).amountDue;
    return {
      branch,
      employeeCount: existingEmployees(list.value).length,
      detail: { label: "Should receive", value: formatMoney(due) },
      query: period && requested ? `?period=${period.key}` : "",
    };
  });

  return (
    <>
      <PageHeader
        title="Employees"
        description="Open a branch to see your employees there and what each one should receive."
        actions={
          <div className="flex flex-wrap gap-3">
            <EmployeeExportButtons />
            <Link href="/agent/requests" className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed">
              My Requests
            </Link>
            <Link href="/agent/employees/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container">
              <Icon name="person_add" className="text-[18px]" />
              Add Employee
            </Link>
          </div>
        }
      />
      <PeriodPicker periods={periods} selected={period} action={buildHref("/agent/employees", {})} />
      <PayMetrics payslips={shown} period={period} />
      <BranchCards basePath="/agent/employees/branches" items={items} />
    </>
  );
}
