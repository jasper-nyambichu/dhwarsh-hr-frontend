import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";
import { formatMonthYear, formatMoney } from "@/lib/format";
import type { Payslip } from "@/types";

/**
 * Printable payslip document.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Payslip`. Swap for
 * `await api.get<Payslip>(`/payroll/payslips/${id}`)` when ready. The
 * company header block (name/address/KRA PIN) should come from
 * `GET /company` rather than being hardcoded here once wired.
 * ─────────────────────────────────────────────────────────────────────────
 */

const PAYSLIP: Payslip & { employeeDepartment: string; nationalId: string; bankAccountMasked: string; paidDate: string } = {
  id: 1,
  payrollRunId: 1,
  employeeId: 1190,
  employeeName: "Amina Yusuf",
  employeeNumber: "EMP-1190",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  basicSalary: 120_000,
  houseAllowance: 15_000,
  transportAllowance: 10_000,
  overtimePay: 5_000,
  bonus: 0,
  otherAllowances: null,
  grossPay: 150_000,
  shifDeduction: 3_300,
  nssfDeduction: 1_080,
  housingLevyDeduction: 1_800,
  payeDeduction: 24_700,
  nitaDeduction: null,
  loanDeduction: 5_000,
  otherDeductions: 0,
  netPay: 114_120,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  employeeDepartment: "Marketing",
  nationalId: "10293847",
  bankAccountMasked: "****9012",
  paidDate: "28th Aug 2026",
};

export default async function PayslipDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("payroll:read");
  const { id } = await params;
  const slip = PAYSLIP; // TODO: fetch by `id` once the endpoint exists

  const totalDeductions =
    (slip.payeDeduction ?? 0) +
    (slip.nssfDeduction ?? 0) +
    (slip.shifDeduction ?? 0) +
    (slip.housingLevyDeduction ?? 0) +
    (slip.loanDeduction ?? 0) +
    (slip.otherDeductions ?? 0);

  return (
    <div className="bg-surface-container-low py-8">
      {/* action bar — hidden on print */}
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end gap-4 px-4 print:hidden">
        <button
          type="button"
          onClick={undefined}
          className="flex items-center gap-2 rounded px-4 py-2 font-body-md text-body-md text-primary transition-colors hover:bg-surface-container"
        >
          <Icon name="print" className="text-[18px]" />
          PRINT
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded bg-primary px-4 py-2 font-body-md text-body-md font-bold text-white transition-colors hover:bg-primary-container"
        >
          <Icon name="download" className="text-[18px]" />
          DOWNLOAD PDF
        </button>
      </div>

      {/* A4 sheet */}
      <div className="mx-auto min-h-[297mm] w-[210mm] rounded-xl bg-white p-[20mm] shadow-ambient-2 print:min-h-0 print:w-auto print:p-[15mm] print:shadow-none">
        <div className="mb-8 flex items-start justify-between border-b border-outline-variant pb-6">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded bg-primary-fixed font-page-title text-page-title font-bold text-primary">
              D
            </span>
            <div>
              <h1 className="m-0 p-0 font-page-title text-page-title text-primary">Dhwarsh HR Ltd</h1>
              <p className="m-0 mt-1 p-0 font-body-md text-body-md text-on-surface-variant">
                P.O. Box 45678-00100, Nairobi
              </p>
              <p className="m-0 p-0 font-body-md text-body-md text-on-surface-variant">KRA PIN: P051234567A</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="m-0 p-0 font-display-greeting text-display-greeting text-primary">PAYSLIP</h2>
            <p className="m-0 mt-2 p-0 font-body-md text-body-md font-bold text-on-surface">
              {formatMonthYear(slip.periodStart)}
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-surface-container-high bg-surface-bright p-4">
          <InfoRow label="Employee Name:" value={slip.employeeName ?? "—"} />
          <InfoRow label="Employee ID:" value={slip.employeeNumber ?? "—"} />
          <InfoRow label="Department:" value={slip.employeeDepartment} />
          <InfoRow label="National ID:" value={slip.nationalId} />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-4 border-b border-outline-variant pb-2 font-table-header text-table-header uppercase text-secondary">
              Earnings
            </h3>
            <div className="flex flex-col gap-3 font-body-md text-body-md">
              <LineItem label="Basic Salary" value={slip.basicSalary} />
              <LineItem label="House Allowance" value={slip.houseAllowance ?? 0} />
              <LineItem label="Transport Allowance" value={slip.transportAllowance ?? 0} />
              <LineItem label="Overtime" value={slip.overtimePay ?? 0} />
              <LineItem label="Bonus" value={slip.bonus ?? 0} />
            </div>
            <div className="mt-4 flex justify-between border-t border-outline-variant pt-3 font-body-md text-body-md font-bold text-on-surface">
              <span>Total Earnings</span>
              <span>{formatMoney(slip.grossPay, { showCurrency: false })}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 border-b border-outline-variant pb-2 font-table-header text-table-header uppercase text-secondary">
              Deductions
            </h3>
            <div className="flex flex-col gap-3 font-body-md text-body-md">
              <LineItem label="PAYE" value={slip.payeDeduction ?? 0} />
              <LineItem label="NSSF" value={slip.nssfDeduction ?? 0} />
              <LineItem label="SHIF" value={slip.shifDeduction ?? 0} />
              <LineItem label="Housing Levy" value={slip.housingLevyDeduction ?? 0} />
              <LineItem label="Loan Deduction" value={slip.loanDeduction ?? 0} />
              <LineItem label="Other" value={slip.otherDeductions ?? 0} />
            </div>
            <div className="mt-4 flex justify-between border-t border-outline-variant pt-3 font-body-md text-body-md font-bold text-on-surface">
              <span>Total Deductions</span>
              <span>{formatMoney(totalDeductions, { showCurrency: false })}</span>
            </div>
          </div>
        </div>

        <div className="mb-12 flex items-center justify-between rounded-lg border border-primary-fixed bg-[#f0f7ff] p-6">
          <span className="font-page-title text-page-title text-primary">Net Pay</span>
          <span className="font-display-greeting text-display-greeting font-bold text-primary">
            {formatMoney(slip.netPay)}
          </span>
        </div>

        <div className="border-t border-outline-variant pt-6 text-center">
          <p className="mb-2 font-body-md text-body-md text-on-surface-variant">
            Paid via Bank Transfer to KCB Bank - A/C {slip.bankAccountMasked} on {slip.paidDate}.
          </p>
          <p className="font-table-header text-table-header uppercase text-outline">
            This is a system generated payslip and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
      <span className="font-body-md text-body-md font-bold text-on-surface">{value}</span>
    </div>
  );
}

function LineItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface">{formatMoney(value, { showCurrency: false })}</span>
    </div>
  );
}