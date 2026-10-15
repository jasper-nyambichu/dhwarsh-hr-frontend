import type { PayrollRunResponse, PayrollRunState } from "@/types/payroll";

function count(csv: string | null): number {
  return csv ? csv.split(",").filter(Boolean).length : 0;
}

/** "All employees", or "2 branches, 1 agent" — what a run covered. */
export function runScopeLabel(
  run: Pick<PayrollRunResponse, "scopeBranchIds" | "scopeAgentIds" | "scopeDepartmentIds">,
): string {
  const branches = count(run.scopeBranchIds);
  const agents = count(run.scopeAgentIds);
  const departments = count(run.scopeDepartmentIds);

  if (branches + agents + departments === 0) return "All employees";

  const parts: string[] = [];
  if (branches) parts.push(`${branches} branch${branches === 1 ? "" : "es"}`);
  if (agents) parts.push(`${agents} agent${agents === 1 ? "" : "s"}`);
  if (departments) parts.push(`${departments} department${departments === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export const RUN_STATUS_CHIP: Record<PayrollRunState, string> = {
  IN_PROGRESS: "bg-primary-container/10 text-primary-container border border-primary-container/20",
  COMPLETED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20",
  FAILED: "bg-error/10 text-error border border-error/20",
};