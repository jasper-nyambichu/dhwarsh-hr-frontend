import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayslipDocument } from "@/components/features/payroll/payslip-document";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getPayslip } from "@/lib/api/payroll";
import type { PayslipResponse } from "@/types/payroll";

/** One of the agent's own employees' statements. The server refuses anyone else's. */
export default async function AgentPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agentsummary:read:self");

  const { id } = await params;
  const payslipId = Number(id);
  if (!Number.isInteger(payslipId) || payslipId <= 0) notFound();

  let payslip: PayslipResponse;
  try {
    payslip = await getPayslip(payslipId);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.status === 403)) notFound();
    return (
      <DataUnavailable
        title="Employee statement"
        subject="This statement"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <PayslipDocument
      payslip={payslip}
      backHref={`/agent/summaries/${payslip.payrollRunId}`}
      backLabel="Back to the payroll summary"
    />
  );
}