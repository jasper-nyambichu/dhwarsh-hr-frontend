import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getEmployeeDocuments } from "@/lib/api/document";
import { getEmployee } from "@/lib/api/employee";
import type { EmployeeDocumentResponse, EmployeeResponse } from "@/types";

import { DocumentManager } from "./_components/document-manager";

/**
 * An employee's documents.
 *
 * Reads the employee as well as the documents, because the only place the file
 * name belongs is next to whose file it is — `EmployeeDocumentResponse` carries
 * an id, not a name.
 *
 * The employee read 404s for an unknown id and the documents read 403s for a
 * role that may read the employee but not their files. Both are told apart
 * rather than collapsed into one failure card.
 */
export default async function EmployeeDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("employee:read");

  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  let employee: EmployeeResponse;
  let documents: EmployeeDocumentResponse[];

  try {
    [employee, documents] = await Promise.all([
      getEmployee(employeeId),
      getEmployeeDocuments(employeeId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    if (error instanceof ApiError && error.isNotFound) {
      notFound();
    }

    return (
      <DataUnavailable
        title="Employee Documents"
        description="Compliance documents attached to one employee."
        subject={`The documents for employee #${employeeId}`}
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`${employee.fullName} — Documents`}
        description={`${employee.employeeNumber} · ${
          employee.branchName ?? "No branch"
        }`}
        actions={
          <Link
            href={`/hr/employees/${employeeId}`}
            className={buttonVariants({ variant: "secondary" })}
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back to record
          </Link>
        }
      />

      <DocumentManager employeeId={employeeId} documents={documents} />
    </>
  );
}
