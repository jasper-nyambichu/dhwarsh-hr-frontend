import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getAllAgentSummaries } from "@/lib/api/finance";
import { formatDateRange, formatNumber, formatPercent } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

function Row({ label, amount, strong = false }: { label: string; amount: number | null; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 py-2 text-sm last:border-0">
      <span className={strong ? "font-semibold text-on-surface" : "text-on-surface-variant"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-on-surface" : "text-on-surface"}`}>{formatKes(amount ?? 0)}</span>
    </div>
  );
}

const DOCUMENTS = [
  { kind: "invoice", label: "Invoice (PDF)" },
  { kind: "voucher", label: "Payment voucher (PDF)" },
  { kind: "summary", label: "Payroll summary (PDF)" },
] as const;

/** One agent statement: the payment formula line by line, with its three PDF documents. */
export default async function FinanceInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoice:read");

  const { id } = await params;
  const summaryId = Number(id);
  if (!Number.isInteger(summaryId) || summaryId <= 0) notFound();

  let summaries: Awaited<ReturnType<typeof getAllAgentSummaries>>;
  try {
    summaries = await getAllAgentSummaries();
  } catch (error) {
    return (
      <DataUnavailable
        title="Agent statement"
        subject="This statement"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const summary = summaries.find((item) => item.id === summaryId);
  if (!summary) notFound();

  return (
    <>
      <PageHeader
        title={
          <>
            <Link href="/finance/invoices" className="mr-2 text-sm font-medium text-primary hover:underline">
              ← Agent invoices
            </Link>
            {summary.agentName ?? `Agent #${summary.agentId}`}
          </>
        }
        description={`${formatDateRange(summary.periodStart, summary.periodEnd)} · ${formatNumber(summary.employeeCount)} employees`}
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <BentoCard className="lg:col-span-2" title="Payment statement" subtitle="How the amount payable is built up">
          <Row label="Gross salaries" amount={summary.grossSalaries} />
          <Row label="Service charge" amount={summary.serviceCharge} />
          <Row label="SHIF" amount={summary.shifTotal} />
          <Row label="NSSF" amount={summary.nssfTotal} />
          <Row label="Housing Levy" amount={summary.housingLevyTotal} />
          <Row label="PAYE" amount={summary.payeTotal} />
          <Row label="Employee loan deductions" amount={summary.employeeLoanDeductionsTotal} />
          <Row label="Less: advance recovery" amount={summary.advanceRecoveryTotal} />
          <Row label="Subtotal before VAT" amount={summary.subtotalBeforeVat} strong />
          <Row
            label={summary.vatApplied ? `VAT (${formatPercent(summary.vatRateUsed)})` : "VAT (not applied)"}
            amount={summary.vatAmount}
          />
          <Row label="Final amount payable" amount={summary.finalAmountPayable} strong />
        </BentoCard>

        <BentoCard title="Documents" subtitle="Open in a new tab">
          <ul className="flex flex-col gap-2">
            {DOCUMENTS.map((document) => (
              <li key={document.kind}>
                <a
                  href={`/api/payroll/documents/${summary.payrollRunId}/${summary.agentId}/${document.kind}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between rounded-lg border border-outline-variant px-3 text-sm font-semibold text-primary hover:bg-surface-container-low"
                >
                  {document.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href={`/finance/disbursements/${summary.payrollRunId}`}
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            See the whole run
          </Link>
        </BentoCard>
      </div>
    </>
  );
}