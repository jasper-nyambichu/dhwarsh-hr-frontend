import { formatDateRange } from "@/lib/format";
import type { FinanceRunSummary } from "@/types/finance";

/**
 * What the company itself remits for direct staff: PAYE and Housing Levy when switched on, and the
 * employer NITA. SHIF and NSSF are NOT here: the firm pays no pension, so they are paid to the
 * employee inside the salary.
 */
export function directStatutory(run: FinanceRunSummary): number {
  return run.directPaye + run.directHousingLevy + run.directNita;
}

/** Taxes inside the agent payments. The agents remit these, not the company. */
export function agentStatutory(run: FinanceRunSummary): number {
  return run.agentPaye + run.agentHousingLevy;
}

/** SHIF + NSSF paid to direct employees inside their salary. */
export function directPaidInSalary(run: FinanceRunSummary): number {
  return run.directShif + run.directNssf;
}

/** SHIF + NSSF paid to agent-supplied employees inside their salary. */
export function agentPaidInSalary(run: FinanceRunSummary): number {
  return run.agentShif + run.agentNssf;
}

/** "1 Oct – 31 Oct 2026". */
export function runPeriod(run: Pick<FinanceRunSummary, "periodStart" | "periodEnd">): string {
  return formatDateRange(run.periodStart, run.periodEnd);
}