import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AssignDepartmentForm } from "@/components/features/staff/assign-department-form";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getDepartments } from "@/lib/api/department";
import { getEmployee } from "@/lib/api/employee";
import { formatDate, humanizeEnum } from "@/lib/format";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2.5 last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-medium text-on-surface">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

/** One employee of the branch — the backend refuses anyone from another branch. */
export default async function BranchEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employee:read:branch");

  const { employeeId: raw } = await params;
  const employeeId = Number(raw);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let employee: Awaited<ReturnType<typeof getEmployee>>;
  let departments: Awaited<ReturnType<typeof getDepartments>>;
  try {
    [employee, departments] = await Promise.all([getEmployee(employeeId), getDepartments()]);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) notFound();
    return <DataUnavailable title="Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/branch/team" aria-label="Back to my team" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {employee.fullName}
            <StatusBadge status={employee.employmentStatus} />
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}`}
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8">
          <BentoCard title="Details">
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <div>
                <Row label="Phone" value={employee.phone} />
                <Row label="Email" value={employee.email} />
                <Row label="Position" value={employee.position} />
                <Row label="Employment type" value={humanizeEnum(employee.employmentType)} />
              </div>
              <div>
                <Row label="Date hired" value={employee.dateHired ? formatDate(employee.dateHired) : null} />
                <Row label="Department" value={employee.departmentName ?? "Not assigned"} />
                <Row label="Agent" value={employee.agentName ?? "Paid directly"} />
                <Row label="Emergency contact" value={employee.emergencyContactName} />
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <AssignDepartmentForm
            employeeId={employee.id}
            currentDepartmentId={employee.departmentId}
            departments={departments.map((department) => ({ id: department.id, name: department.name }))}
          />
        </div>
      </div>
    </>
  );
}