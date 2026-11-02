import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayslipDetail } from "@/components/features/payslip/payslip-views";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getCompany } from "@/lib/api/company";
import { getPayslip } from "@/lib/api/payslip";
import type { EmployeePayslip } from "@/types/payslip";

/** One payslip. The backend refuses one this viewer may not see. */
export default async function AgentPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("payslip:read:self");

  const { id } = await params;
  const payslipId = Number(id);
  if (!Number.isInteger(payslipId) || payslipId <= 0) notFound();

  let payslip: EmployeePayslip;
  try {
    payslip = await getPayslip(payslipId);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    return <DataUnavailable title="Payslip" subject="This payslip" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  // Only decides whether a logo is shown, so a failure here must not hide the payslip.
  const company = await getCompany().catch(() => null);

  return <PayslipDetail payslip={payslip} backHref="/agent/payslips" hasLogo={Boolean(company?.logoUrl)} />;
}
