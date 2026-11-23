import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getEmployee } from "@/lib/api/employee";
import { formatDate, formatMoney, humanizeEnum } from "@/lib/format";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-outline-variant/20 py-2.5 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-medium text-on-surface">{value ?? "—"}</span>
    </div>
  );
}

/** One employee's record in the Accounts Office, with Edit to change their details. */
export default async function AccountsEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employee:read");

  const employeeId = Number((await params).employeeId);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let employee: Awaited<ReturnType<typeof getEmployee>>;
  try {
    employee = await getEmployee(employeeId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const backHref = employee.branchId ? `/accounts/employees/branches/${employee.branchId}` : "/accounts/employees";
  const editHref = `/accounts/employees/${employee.id}/edit`;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href={backHref} aria-label="Back to the branch" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {employee.fullName}
            <StatusBadge status={employee.employmentStatus} />
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}${employee.departmentName ? ` · ${employee.departmentName}` : ""}`}
        actions={
          <Link
            href={editHref}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm hover:bg-primary-container"
          >
            <Icon name="edit" className="text-[18px]" />
            Edit Employee
          </Link>
        }
      />

      <BentoCard
        title="Details"
        action={
          <Link href={editHref} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <Icon name="edit" className="text-[16px]" />
            Edit
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div>
            <Row label="National ID" value={employee.nationalId} />
            <Row label="Phone" value={employee.phone} />
            <Row label="Email" value={employee.email} />
            <Row label="Gender" value={employee.gender} />
            <Row label="Date of birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null} />
            <Row label="KRA PIN" value={employee.kraPin} />
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
    </>
  );
}
