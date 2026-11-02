import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { StaffRequestsView } from "@/components/features/staff/staff-requests-view";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getMyStaffRequests } from "@/lib/api/staff-requests";
import { first } from "@/lib/search-params";

/** The Admin's decision on each employee this manager added. `?sent=1` confirms one just sent. */
export default async function BranchApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("employee:request");

  const params = await searchParams;
  const sent = first(params.sent) === "1";

  let requests: Awaited<ReturnType<typeof getMyStaffRequests>>;
  try {
    requests = await getMyStaffRequests();
  } catch (error) {
    return <DataUnavailable title="Approvals" subject="Your approvals" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <StaffRequestsView
      requests={requests}
      basePath="/branch/approvals"
      addHref="/branch/employees/new"
      sent={sent}
      title="Approvals"
      description="Employees you have added, and whether the Administrator has approved them."
    />
  );
}
