import "server-only";

import { getBranches } from "@/lib/api/branch";
import { getMyBranchDirectory } from "@/lib/api/employee";
import type { Status } from "@/types";
import type { OffDayResponse } from "@/types/off-day";

export type AgentOffEmployee = { id: number; fullName: string; employeeNumber: string; departmentName: string | null };

export type AgentOffBranch = {
  id: number;
  name: string;
  code: string;
  status: Status;
  /** Active employees only. Null when this branch's list could not be read. */
  employees: AgentOffEmployee[] | null;
};

/**
 * The branches that matter to this agent: where they have active employees, or an off day to show.
 * Only the fields the page needs are kept, so pay in the directory never reaches the browser from here.
 */
export async function getAgentOffBranches(offDays: OffDayResponse[]): Promise<AgentOffBranch[]> {
  const branches = await getBranches();
  const lists = await Promise.allSettled(branches.map((branch) => getMyBranchDirectory(branch.id)));

  return branches
    .map((branch, index): AgentOffBranch => {
      const list = lists[index];
      return {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        status: branch.status,
        employees:
          list?.status === "fulfilled"
            ? list.value
                .filter((person) => person.employmentStatus === "ACTIVE")
                .map((person) => ({
                  id: person.id,
                  fullName: person.fullName,
                  employeeNumber: person.employeeNumber,
                  departmentName: person.departmentName,
                }))
                .sort((a, b) => a.fullName.localeCompare(b.fullName))
            : null,
      };
    })
    .filter((branch) => branch.employees === null || branch.employees.length > 0 || offDays.some((offDay) => offDay.branchId === branch.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}
