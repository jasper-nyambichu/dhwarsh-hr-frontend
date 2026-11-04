import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { StaffRequestsView } from "@/components/features/staff/staff-requests-view";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { getMyStaffRequests } from "@/lib/api/staff-requests";
import { first } from "@/lib/search-params";

/** The Agent's employee requests. `?sent=1` shows the "request sent" confirmation. */
export default async function AgentRequestsPage({
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
    return (
      <DataUnavailable
        title="My requests"
        subject="Your requests"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return <StaffRequestsView requests={requests} basePath="/agent/requests" addHref="/agent/employees/new" sent={sent} />;
}