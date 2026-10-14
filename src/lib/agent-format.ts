import { formatMoney, formatPercent } from "@/lib/format";
import type { AgentResponse } from "@/types";

/** "KES 500.00 per employee" — how the agent's service charge is billed. */
export function chargeSummary(
  agent: Pick<AgentResponse, "chargeType" | "chargeAmount" | "chargePercentage">,
): string {
  switch (agent.chargeType) {
    case "PER_EMPLOYEE":
      return `${formatMoney(agent.chargeAmount)} per employee`;
    case "PERCENTAGE_OF_GROSS":
      return `${formatPercent(agent.chargePercentage, 2)} of gross salaries`;
    case "FIXED_MONTHLY":
      return `${formatMoney(agent.chargeAmount)} per month`;
    default:
      return `${formatMoney(agent.chargeAmount)} (custom)`;
  }
}