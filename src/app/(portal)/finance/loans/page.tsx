import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { LoanList } from "@/components/features/money/money-lists";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getLoans } from "@/lib/api/agent-money";
import { formatNumber } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

/** Every employee loan, company-wide, as the Accounts Office sees it. Read-only: Payroll and Admin decide loans. */
export default async function FinanceLoansPage() {
  await requirePermission("loan:read");

  let loans: Awaited<ReturnType<typeof getLoans>>;
  try {
    loans = await getLoans();
  } catch (error) {
    return (
      <DataUnavailable
        title="Loans"
        subject="The loan portfolio"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const approved = loans.filter((loan) => loan.status === "APPROVED");
  const outstanding = approved.reduce((sum, loan) => sum + (loan.outstandingBalance ?? 0), 0);
  const pending = loans.filter((loan) => loan.status === "PENDING").length;

  return (
    <>
      <PageHeader title="Loans" description="Employee loans and what is still to be recovered from salary." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Outstanding" value={formatKes(outstanding)} icon="account_balance_wallet" tone="primary" hint="On approved loans" />
        <MetricCard label="Being repaid" value={formatNumber(approved.length)} icon="savings" tone="primary" />
        <MetricCard label="Awaiting a decision" value={formatNumber(pending)} icon="pending_actions" tone={pending > 0 ? "amber" : "primary"} />
      </div>

      <BentoCard className="mt-gutter" title="All loans" subtitle="Newest first">
        {loans.length === 0 ? (
          <EmptyState symbol="savings" title="No loans yet" description="Loans appear here once they are requested." />
        ) : (
          <LoanList loans={loans} />
        )}
      </BentoCard>
    </>
  );
}