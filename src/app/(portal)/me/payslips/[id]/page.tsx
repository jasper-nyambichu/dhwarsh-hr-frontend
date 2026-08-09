//src/app/(portal)/employee/payslips/[id]/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";

/**
 * Single payslip document view (print/download-ready).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Payslip` + `types.Employee` +
 * `types.Company`. Backend should return the full breakdown by payslip ID;
 * `params.id` is currently unused beyond the fetch it will drive.
 * ─────────────────────────────────────────────────────────────────────────
 */

type LineItem = { label: string; amount: number };

type PayslipDetail = {
  id: string;
  period: string;
  company: { name: string; address: string; pin: string; logoUrl: string | null };
  employee: {
    name: string;
    employeeId: string;
    department: string;
    kraPin: string;
    nssfNo: string;
    nhifNo: string;
  };
  earnings: LineItem[];
  deductions: LineItem[];
  netPay: number;
  bank: { name: string; accountMasked: string };
};

async function getPayslip(id: string): Promise<PayslipDetail> {
  // TODO: replace with real fetch against the payroll API using `id`.
  return {
    id,
    period: "October 2023",
    company: {
      name: "Zee Technologies Ltd",
      address: "P.O. Box 12345 - 00100, Nairobi, Kenya",
      pin: "P051234567Z",
      logoUrl: null,
    },
    employee: {
      name: "Taruk Makena",
      employeeId: "EMP-2021-045",
      department: "Engineering",
      kraPin: "A012345678Z",
      nssfNo: "NS12345678",
      nhifNo: "NH98765432",
    },
    earnings: [
      { label: "Basic Salary", amount: 150000 },
      { label: "House Allowance", amount: 30000 },
      { label: "Commuter Allowance", amount: 15000 },
    ],
    deductions: [
      { label: "PAYE (KRA)", amount: 48500 },
      { label: "NSSF (Tier I & II)", amount: 1080 },
      { label: "SHIF (2.75%)", amount: 5362.5 },
      { label: "Housing Levy (1.5%)", amount: 2925 },
      { label: "Sacco Loan Repayment", amount: 15000 },
    ],
    netPay: 122132.5,
    bank: { name: "Equity Bank Kenya", accountMasked: "*** *** 8901" },
  };
}

export default async function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("payslip:read:self");
  const { id } = await params;
  const payslip = await getPayslip(id);

  const grossPay = payslip.earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = payslip.deductions.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-surface-container-lowest/50">
      {/* ─────────────────────────────── document controls ─────────────── */}
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between p-container-margin pb-0">
        <Link
          href="/me/payslips"
          className="flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-container"
        >
          <Icon name="arrow_back" className="text-sm" />
          Back to Payslips
        </Link>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <Icon name="print" className="text-sm" />
            Print
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <Icon name="download" className="text-sm" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ─────────────────────────────── document ───────────────────────── */}
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-card bg-surface-container-lowest p-12 shadow-[0_2px_8px_rgba(11,42,69,.06)]">
        <div className="mb-8 flex items-start justify-between border-b border-[#E9EFF5] pb-8">
          <div className="flex items-center gap-4">
            {payslip.company.logoUrl && (
              <img src={payslip.company.logoUrl} alt={payslip.company.name} className="size-20 rounded-lg object-contain" />
            )}
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-[#0B2A45]">{payslip.company.name}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{payslip.company.address}</p>
              <p className="text-sm text-on-surface-variant">PIN: {payslip.company.pin}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="mb-2 font-display-greeting text-2xl text-primary">PAYSLIP</h1>
            <div className="inline-block rounded-md bg-primary-fixed px-3 py-1">
              <span className="text-sm font-bold uppercase tracking-wider text-on-primary-fixed">{payslip.period}</span>
            </div>
          </div>
        </div>

        {/* employee details */}
        <div className="mb-10 grid grid-cols-2 gap-x-12 gap-y-6 rounded-xl border border-outline-variant/30 bg-surface-bright p-6">
          <div>
            <div className="mb-3 flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Employee Name</span>
              <span className="font-bold text-on-surface">{payslip.employee.name}</span>
            </div>
            <div className="mb-3 flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Employee ID</span>
              <span className="text-on-surface">{payslip.employee.employeeId}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Department</span>
              <span className="text-on-surface">{payslip.employee.department}</span>
            </div>
          </div>
          <div>
            <div className="mb-3 flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">KRA PIN</span>
              <span className="text-on-surface">{payslip.employee.kraPin}</span>
            </div>
            <div className="mb-3 flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">NSSF No</span>
              <span className="text-on-surface">{payslip.employee.nssfNo}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">NHIF No</span>
              <span className="text-on-surface">{payslip.employee.nhifNo}</span>
            </div>
          </div>
        </div>

        {/* financial breakdown */}
        <div className="mb-10 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#E9EFF5] pb-2 text-sm font-bold uppercase tracking-wider text-on-surface">
              <Icon name="trending_up" className="text-lg text-tertiary-container" />
              Earnings
            </h3>
            <div className="space-y-4">
              {payslip.earnings.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{item.label}</span>
                  <span className="font-medium text-on-surface">{formatMoney(item.amount, { currency: "KES" })}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[#E9EFF5] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Gross Pay</span>
              <span className="text-base font-bold text-tertiary-container">{formatMoney(grossPay, { currency: "KES" })}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#E9EFF5] pb-2 text-sm font-bold uppercase tracking-wider text-on-surface">
              <Icon name="trending_down" className="text-lg text-error" />
              Deductions
            </h3>
            <div className="space-y-4">
              {payslip.deductions.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{item.label}</span>
                  <span className="font-medium text-on-surface">{formatMoney(item.amount, { currency: "KES" })}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[#E9EFF5] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Total Deductions</span>
              <span className="text-base font-bold text-error">{formatMoney(totalDeductions, { currency: "KES" })}</span>
            </div>
          </div>
        </div>

        {/* net pay */}
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div>
            <h3 className="text-lg font-bold text-primary">Net Pay</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Amount transferred to bank account</p>
          </div>
          <div className="text-right">
            <div className="font-display-greeting text-3xl text-[#0B2A45]">
              {formatMoney(payslip.netPay, { currency: "KES" })}
            </div>
          </div>
        </div>

        {/* payment method + signature */}
        <div className="mt-10 grid grid-cols-2 gap-12 text-sm">
          <div>
            <h4 className="mb-3 border-b border-[#E9EFF5] pb-1 text-xs font-bold uppercase tracking-wider text-on-surface">
              Payment Method
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Bank Name:</span>
                <span className="font-medium text-on-surface">{payslip.bank.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Account No:</span>
                <span className="font-medium text-on-surface">{payslip.bank.accountMasked}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="mb-2 mt-8 w-full border-t border-dashed border-outline-variant/60" />
            <span className="text-xs uppercase tracking-wider text-on-surface-variant">Employer Signature / Stamp</span>
          </div>
        </div>

        <div className="mt-12 text-center text-xs italic text-outline">
          This is a computer-generated document and does not require a signature unless explicitly requested for
          official purposes.
        </div>
      </div>

      <div className="h-12" />
    </div>
  );
}