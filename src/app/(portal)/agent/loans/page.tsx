import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { LoanRequestForm } from "@/components/features/money/agent-forms";
import { LoanList } from "@/components/features/money/money-lists";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAgentEmployees, getAgentLoans } from "@/lib/api/agent-money";

/** The agent's loan requests for their employees, and where each one stands. */
export default async function AgentLoansPage() {
  const session = await requirePermission("loan:request");

  if (!session.agentId) {
    return <DataUnavailable title="Loans" subject="Your loans" reason="Your account is not linked to an agent." />;
  }

  let employees: Awaited<ReturnType<typeof getAgentEmployees>>;
  let loans: Awaited<ReturnType<typeof getAgentLoans>>;
  try {
    [employees, loans] = await Promise.all([getAgentEmployees(session.agentId), getAgentLoans()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Loans"
        subject="Your loans"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const active = employees.filter((employee) => employee.employmentStatus === "ACTIVE");
  const waiting = loans.filter((loan) => loan.status === "PENDING").length;

  return (
    <>
      <PageHeader
        title="Loans"
        description="Request a loan for one of your employees. Once approved, the instalments come off their pay automatically."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <LoanRequestForm employees={active} />

        <BentoCard
          title="Loans for your employees"
          subtitle={waiting > 0 ? `${waiting} waiting for the Administrator` : `${loans.length} in total`}
        >
          {loans.length === 0 ? (
            <EmptyState
              symbol="savings"
              title="No loans yet"
              description="Loans you request for your employees appear here with the Administrator's decision."
            />
          ) : (
            <LoanList loans={loans} />
          )}
        </BentoCard>
      </div>
    </>
  );
}