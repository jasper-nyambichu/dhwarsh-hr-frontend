import { endOfMonth, format, startOfMonth } from "date-fns";

import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getScopeOptions } from "@/lib/api/payroll";

import { RunPayrollForm } from "./_components/run-payroll-form";

/**
 * New payroll run. One step, not a wizard: the backend has no preview or draft
 * stage — submitting calculates and saves everything in a single transaction.
 */
export default async function NewPayrollRunPage() {
  await requirePermission("payroll:run");

  let options: Awaited<ReturnType<typeof getScopeOptions>>;
  try {
    options = await getScopeOptions();
  } catch (error) {
    return (
      <DataUnavailable
        title="New Payroll Run"
        subject="The branch, agent and department lists"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const today = new Date();

  return (
    <>
      <PageHeader
        title="New Payroll Run"
        description="Choose the period and who to pay. Payslips and agent payment documents are produced together."
      />
      <RunPayrollForm
        defaultStart={format(startOfMonth(today), "yyyy-MM-dd")}
        defaultEnd={format(endOfMonth(today), "yyyy-MM-dd")}
        branches={options.branches.map((b) => ({ id: b.id, name: b.name }))}
        agents={options.agents.map((a) => ({ id: a.id, name: a.name }))}
        departments={options.departments.map((d) => ({ id: d.id, name: d.name, hint: d.branchName }))}
      />
    </>
  );
}