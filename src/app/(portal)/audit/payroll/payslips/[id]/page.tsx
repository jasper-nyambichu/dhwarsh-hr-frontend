import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayslipDocument } from "@/components/features/payroll/payslip-document";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getPayslip } from "@/lib/api/payroll";
import type { PayslipResponse } from "@/types/payroll";

/** One employee's payslip, read-only, for audit review. */
export default async function AuditPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("payslip:read");

  const { id } = await params;
  const payslipId = Number(id);
  if (!Number.isInteger(payslipId) || payslipId <= 0) notFound();

  let payslip: PayslipResponse;
  try {
    payslip = await getPayslip(payslipId);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) notFound();
    return <DataUnavailable title="Payslip" subject="This payslip" reason={error instanceof Error ? error.message : undefined} />;
  }

  return <PayslipDocument payslip={payslip} backHref={`/audit/payroll/${payslip.payrollRunId}`} backLabel="Back to Payroll Run" />;
}