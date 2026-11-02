import { format } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeEntryForm } from "@/components/features/staff/employee-entry-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getMyBranch } from "@/lib/api/branch";
import { getDepartments } from "@/lib/api/department";
import { getAgentOptions } from "@/lib/api/staff";

/** The branch manager proposes a new employee for their own branch; an Admin approves it. */
export default async function BranchNewEmployeePage() {
  await requirePermission("employee:request");

  let data: {
    branch: Awaited<ReturnType<typeof getMyBranch>>;
    departments: Awaited<ReturnType<typeof getDepartments>>;
    agents: Awaited<ReturnType<typeof getAgentOptions>>;
  };
  try {
    const [branch, departments, agents] = await Promise.all([getMyBranch(), getDepartments(), getAgentOptions()]);
    data = { branch, departments, agents };
  } catch (error) {
    return (
      <DataUnavailable
        title="Add Employee"
        subject="The form options"
        reason={error instanceof ApiError ? error.message : "Your account may not be assigned to a branch yet — ask an Admin."}
      />
    );
  }

  return (
    <>
      <PageHeader title="Add Employee" description={`New staff for ${data.branch.name}. An Admin reviews and approves them.`} />
      <EmployeeEntryForm
        mode="request"
        branches={[]}
        lockedBranch={{ id: data.branch.id, name: data.branch.name }}
        departments={data.departments.map((department) => ({ id: department.id, name: department.name }))}
        agents={data.agents}
        agentRequired
        today={format(new Date(), "yyyy-MM-dd")}
        cancelHref="/branch/employees"
      />
    </>
  );
}