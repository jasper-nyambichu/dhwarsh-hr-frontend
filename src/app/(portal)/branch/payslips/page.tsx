import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayslipList } from "@/components/features/payslip/payslip-views";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getMyBranchPayslips } from "@/lib/api/payslip";
import type { EmployeePayslip } from "@/types/payslip";

/** Payslips for your branch, with what was due and what agents recorded paying. */
export default async function BranchPayslipsPage() {
  await requirePermission("payslip:read:branch");

  let payslips: EmployeePayslip[];
  try {
    payslips = await getMyBranchPayslips();
  } catch (error) {
    return <DataUnavailable title="Payslips" subject="The payslips" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return <PayslipList payslips={payslips} basePath="/branch/payslips" description="Payslips for your branch, with what was due and what agents recorded paying." />;
}
