import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";

import { DepartmentForm } from "../_components/department-form";

/** Add a company-wide department. */
export default async function NewDepartmentPage() {
  await requirePermission("department:write");

  return (
    <>
      <PageHeader title="Add Department" description="Create a department every branch can use." />
      <DepartmentForm mode="create" />
    </>
  );
}