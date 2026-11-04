import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeePayTable, PayMetrics, PeriodPicker } from "@/components/features/agents/employee-pay";
import { existingEmployees } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { choosePeriod, inPeriod, payPeriods } from "@/lib/agent-pay";
import { getBranches } from "@/lib/api/branch";
import { getMyBranchDirectory } from "@/lib/api/employee";
import { getMyAgentPayslips } from "@/lib/api/payslip";
import { first } from "@/lib/search-params";

/** This agent's employees at one branch, with each one's pay and deductions from the Admin's calculation. */
export default async function AgentBranchEmployeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("agent:read:self");

  const branchId = Number((await params).id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();
  const requested = first((await searchParams).period);

  let data: {
    branches: Awaited<ReturnType<typeof getBranches>>;
    employees: Awaited<ReturnType<typeof getMyBranchDirectory>>;
    payslips: Awaited<ReturnType<typeof getMyAgentPayslips>>;
  };
  try {
    // An agent may list branches but not read one by id, so the name comes from the list.
    const [branches, employees, payslips] = await Promise.all([getBranches(), getMyBranchDirectory(branchId), getMyAgentPayslips()]);
    data = { branches, employees, payslips };
  } catch (error) {
    return <DataUnavailable title="Branch employees" subject="Your employees at this branch" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const branch = data.branches.find((item) => item.id === branchId);
  if (!branch) notFound();

  const ids = new Set(data.employees.map((person) => person.id));
  const ownPayslips = data.payslips.filter((payslip) => ids.has(payslip.employeeId));
  const periods = payPeriods(ownPayslips);
  const period = choosePeriod(periods, requested);
  const shown = inPeriod(ownPayslips, period);

  // Someone who has left still shows while a payslip of theirs is on screen: the money is still owed.
  const paidIds = new Set(shown.map((payslip) => payslip.employeeId));
  const existing = new Set(existingEmployees(data.employees).map((person) => person.id));
  const employees = data.employees.filter((person) => existing.has(person.id) || paidIds.has(person.id));

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href="/agent/employees"
              aria-label="Back to branches"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{branch.name}</span>
          </span>
        }
        actions={<div className="flex flex-wrap gap-3"><EmployeeExportButtons branchId={branchId} /></div>}
      />
      <PeriodPicker periods={periods} selected={period} action={`/agent/employees/branches/${branchId}`} />
      <PayMetrics payslips={shown} period={period} />
      <EmployeePayTable employees={employees} payslips={shown} period={period} />
    </>
  );
}
