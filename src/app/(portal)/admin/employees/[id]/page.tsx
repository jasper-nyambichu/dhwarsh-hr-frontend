import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AssignDepartmentForm } from "@/components/features/staff/assign-department-form";
import { TerminateEmployeeButton } from "@/components/features/staff/terminate-employee-button";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getDepartments } from "@/lib/api/department";
import { getEmployee } from "@/lib/api/employee";
import { formatMoney, formatDate, humanizeEnum } from "@/lib/format";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2.5 last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-medium text-on-surface">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

/** One employee's record, with department assignment and termination. */
export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:write");

  const { id } = await params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let employee: Awaited<ReturnType<typeof getEmployee>>;
  let departments: Awaited<ReturnType<typeof getDepartments>>;
  try {
    [employee, departments] = await Promise.all([getEmployee(employeeId), getDepartments()]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/admin/employees" aria-label="Back to employees" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {employee.fullName}
            <StatusBadge status={employee.employmentStatus} />
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}`}
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title="Details">
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <div>
                <Row label="National ID" value={employee.nationalId} />
                <Row label="Phone" value={employee.phone} />
                <Row label="Email" value={employee.email} />
                <Row label="Gender" value={employee.gender} />
                <Row label="Date of birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null} />
              </div>
              <div>
                <Row label="Position" value={employee.position} />
                <Row label="Employment type" value={humanizeEnum(employee.employmentType)} />
                <Row label="Basic salary" value={employee.basicSalary === null ? null : formatMoney(employee.basicSalary)} />
                <Row label="Date hired" value={employee.dateHired ? formatDate(employee.dateHired) : null} />
                <Row label="Agent" value={employee.agentName ?? "Paid directly"} />
                <Row label="M-Pesa number" value={employee.bankAccountNumber} />
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <AssignDepartmentForm
            employeeId={employee.id}
            currentDepartmentId={employee.departmentId}
            departments={departments.map((department) => ({ id: department.id, name: department.name }))}
          />
          {employee.employmentStatus === "ACTIVE" ? <TerminateEmployeeButton employeeId={employee.id} name={employee.fullName} /> : null}
        </div>
      </div>
    </>
  );
}