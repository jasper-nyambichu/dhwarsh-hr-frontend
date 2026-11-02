import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AgentPaymentForm } from "@/components/features/settings/agent-payment-form";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMe } from "@/lib/api/user";

/** A Branch Manager stands in for the Admin, only while the Admin allows it. The backend enforces the same. */
export default async function BranchAgentPaymentsPage() {
  await requirePermission("agentpayment:run");

  let allowed: boolean;
  try {
    allowed = (await getMe()).canRunPayments;
  } catch (error) {
    return <DataUnavailable title="Agent Payments" subject="Your access" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader title="Agent Payments" description="Run the calculation while the Administrator is away." />
      {allowed ? (
        <AgentPaymentForm
          subtitle="Runs for every agent and branch, using the days locked for exactly this period. The Administrator is notified and releases the money."
          successText="Agent payments calculated. The Administrator has been notified and releases them under Money Requests."
        />
      ) : (
        <BentoCard title="Agent Payments">
          <EmptyState symbol="lock" title="Not allowed right now" description="The Administrator decides who can run this. You will be notified if you are allowed." />
        </BentoCard>
      )}
    </>
  );
}
