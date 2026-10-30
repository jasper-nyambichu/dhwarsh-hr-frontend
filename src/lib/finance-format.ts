import { formatDateRange } from "@/lib/format";
import type { FinanceRunSummary } from "@/types/finance";

/** What the company itself remits for direct staff: PAYE, NSSF, SHIF, Housing Levy and the employer NITA. */
export function directStatutory(run: FinanceRunSummary): number {
  return run.directPaye + run.directNssf + run.directShif + run.directHousingLevy + run.directNita;
}

/** Statutory amounts inside the agent payments. The agents remit these, not the company. */
export function agentStatutory(run: FinanceRunSummary): number {
  return run.agentPaye + run.agentNssf + run.agentShif + run.agentHousingLevy;
}

/** "1 Oct – 31 Oct 2026". */
export function runPeriod(run: Pick<FinanceRunSummary, "periodStart" | "periodEnd">): string {
  return formatDateRange(run.periodStart, run.periodEnd);
}