import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayslipList } from "@/components/features/payslip/payslip-views";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getMyAgentPayslips } from "@/lib/api/payslip";
import type { EmployeePayslip } from "@/types/payslip";

/** Payslips for your employees, with what was due and what you have recorded paying. */
export default async function AgentPayslipsPage() {
  await requirePermission("payslip:read:self");

  let payslips: EmployeePayslip[];
  try {
    payslips = await getMyAgentPayslips();
  } catch (error) {
    return <DataUnavailable title="Payslips" subject="The payslips" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return <PayslipList payslips={payslips} basePath="/agent/payslips" description="Payslips for your employees, with what was due and what you have recorded paying." />;
}
