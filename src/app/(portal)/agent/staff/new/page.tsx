import { format } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeEntryForm } from "@/components/features/staff/employee-entry-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMyAgent } from "@/lib/api/agent";
import { getBranches } from "@/lib/api/branch";
import { getDepartments } from "@/lib/api/department";

/** The agent proposes a new employee under their own agency, at any branch; an Admin approves it. */
export default async function AgentNewEmployeePage() {
  await requirePermission("employee:request");

  let data: {
    agent: Awaited<ReturnType<typeof getMyAgent>>;
    branches: Awaited<ReturnType<typeof getBranches>>;
    departments: Awaited<ReturnType<typeof getDepartments>>;
  };
  try {
    const [agent, branches, departments] = await Promise.all([getMyAgent(), getBranches(), getDepartments()]);
    data = { agent, branches: branches.filter((branch) => branch.status === "ACTIVE"), departments };
  } catch (error) {
    return <DataUnavailable title="Add Employee" subject="The form options" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  if (data.branches.length === 0) {
    return (
      <>
        <PageHeader title="Add Employee" />
        <EmptyState symbol="location_off" title="No branch available" description="Branches are created by an Admin. Ask them to set one up first." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Add Employee" description="Choose the branch where the employee will work. An Admin reviews and approves them." />
      <EmployeeEntryForm
        mode="request"
        branches={data.branches.map((branch) => ({ id: branch.id, name: branch.name }))}
        lockedAgent={{ id: data.agent.id, name: data.agent.name }}
        departments={data.departments.map((department) => ({ id: department.id, name: department.name }))}
        agents={[]}
        today={format(new Date(), "yyyy-MM-dd")}
        cancelHref="/agent/staff"
      />
    </>
  );
}