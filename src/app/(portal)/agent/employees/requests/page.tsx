import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { RequestList } from "@/components/features/staff/request-list";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyStaffRequests } from "@/lib/api/staff";

/** Employees this agent has submitted, and the Admin's decision on each. */
export default async function AgentRequestsPage() {
  await requirePermission("employee:request");

  let requests: Awaited<ReturnType<typeof getMyStaffRequests>>;
  try {
    requests = await getMyStaffRequests();
  } catch (error) {
    return <DataUnavailable title="My Requests" subject="Your employee requests" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title="My Requests"
        description="New employees you have submitted for approval."
        actions={
          <Link href="/agent/employees/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm hover:bg-primary-container">
            <Icon name="person_add" className="text-[18px]" />
            Add Employee
          </Link>
        }
      />
      <BentoCard title="Requests">
        <RequestList requests={requests} />
      </BentoCard>
    </>
  );
}