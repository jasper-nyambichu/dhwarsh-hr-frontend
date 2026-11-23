import { format } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeEntryForm } from "@/components/features/staff/employee-entry-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getDepartments } from "@/lib/api/department";
import { getAgentOptions } from "@/lib/api/staff";

/** The Accounts Office adds an employee straight away, with the same form as the Admin (no approval step). */
export default async function AccountsNewEmployeePage() {
  await requirePermission("employee:maintain");

  let data: {
    branches: Awaited<ReturnType<typeof getBranches>>;
    departments: Awaited<ReturnType<typeof getDepartments>>;
    agents: Awaited<ReturnType<typeof getAgentOptions>>;
  };
  try {
    const [branches, departments, agents] = await Promise.all([getBranches(), getDepartments(), getAgentOptions()]);
    data = { branches: branches.filter((branch) => branch.status === "ACTIVE"), departments, agents };
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
      <PageHeader title="Add Employee" description="The employee is created immediately." />
      <EmployeeEntryForm
        mode="direct"
        branches={data.branches.map((branch) => ({ id: branch.id, name: branch.name }))}
        departments={data.departments.map((department) => ({ id: department.id, name: department.name }))}
        agents={data.agents}
        today={format(new Date(), "yyyy-MM-dd")}
        cancelHref="/accounts/employees"
      />
    </>
  );
}
