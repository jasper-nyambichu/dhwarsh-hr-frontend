import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayslipList } from "@/components/features/payslip/payslip-views";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getPayslips } from "@/lib/api/payslip";
import type { EmployeePayslip } from "@/types/payslip";

/** Every employee payslip, with what was due and what agents recorded paying. */
export default async function AdminPayslipsPage() {
  await requirePermission("payslip:read");

  let payslips: EmployeePayslip[];
  try {
    payslips = await getPayslips();
  } catch (error) {
    return <DataUnavailable title="Payslips" subject="The payslips" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return <PayslipList payslips={payslips} basePath="/admin/payslips" description="Every employee payslip, with what was due and what agents recorded paying." />;
}
