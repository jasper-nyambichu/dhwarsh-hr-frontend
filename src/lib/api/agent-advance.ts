import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentAdvanceResponse } from "@/types/agent-portal";

/**
 * `controller/agentadvance/AgentAdvanceController` — base `/agent-advances`.
 *
 * The Agent Portal is read-only for advances: `POST /agent-advances` and
 * `PUT /{id}/recover` are SUPER_ADMIN / PAYROLL_OFFICER only. Money is given
 * to the agent by the company and recovered automatically in payroll.
 */

/** The signed-in agent's own advances. AGENT principal only. */
export function getMyAdvances(
  signal?: AbortSignal,
): Promise<AgentAdvanceResponse[]> {
  return api.get<AgentAdvanceResponse[]>("/agent-advances/my-advances", {
    signal,
  });
}