import { formatMoney, formatPercent } from "@/lib/format";
import type { AgentResponse } from "@/types";
import type { AgentSettlementResponse } from "@/types/agent-portal";

/** Pay + PAYE + NSSF + NITA + agent fee: what VAT is charged on. */
export function settlementSubtotal(
  s: Pick<AgentSettlementResponse, "daysPay" | "payeTotal" | "nssfTotal" | "nitaTotal" | "agentFee">,
): number {
  return s.daysPay + s.payeTotal + s.nssfTotal + s.nitaTotal + s.agentFee;
}

/** "KES 500.00 per employee" — how the agent's service charge is billed. */
export function chargeSummary(
  agent: Pick<AgentResponse, "chargeType" | "chargeAmount" | "chargePercentage">,
): string {
  switch (agent.chargeType) {
    case "PER_EMPLOYEE":
      return `${formatMoney(agent.chargeAmount)} per employee`;
    case "PERCENTAGE_OF_GROSS":
      return `${formatPercent(agent.chargePercentage, 2)} of pay`;
    case "FIXED_MONTHLY":
      return `${formatMoney(agent.chargeAmount)} per month`;
    default:
      return `${formatMoney(agent.chargeAmount)} (custom)`;
  }
}