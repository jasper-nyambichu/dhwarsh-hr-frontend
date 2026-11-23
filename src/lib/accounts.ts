import "server-only";

import { getPaymentRequests } from "@/lib/api/agent-money";
import { getAgentPayments } from "@/lib/api/settlement";
import type { AgentSettlementResponse } from "@/types/agent-portal";
import type { PaymentRequestItem } from "@/types/money-flow";

/** One payment the Accounts Office deals with, and the invoice (payroll run) it came from, if any. */
export type AccountsPayment = { request: PaymentRequestItem; invoice: AgentSettlementResponse | null };

/**
 * Everything the Accounts Office pays: each approved payment (an agent invoice from a payroll run, or money an
 * agent asked for and the Admin approved), matched to its invoice. `toPay` oldest first, `paid` newest first.
 */
export async function loadAccountsPayments(): Promise<{ toPay: AccountsPayment[]; paid: AccountsPayment[] }> {
  const [requests, invoices] = await Promise.all([getPaymentRequests(), getAgentPayments()]);
  const byRequest = new Map(invoices.filter((i) => i.paymentRequestId !== null).map((i) => [i.paymentRequestId!, i]));
  const withInvoice = (request: PaymentRequestItem): AccountsPayment => ({ request, invoice: byRequest.get(request.id) ?? null });

  return {
    toPay: requests.filter((r) => r.status === "APPROVED").sort((a, b) => a.id - b.id).map(withInvoice),
    paid: requests
      .filter((r) => r.status === "RELEASED")
      .sort((a, b) => (b.releasedAt ?? "").localeCompare(a.releasedAt ?? "") || b.id - a.id)
      .map(withInvoice),
  };
}

/** "yyyy-MM-dd" for today in Nairobi, the business's day. */
export function todayInNairobi(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
}
