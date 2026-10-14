import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAgentStaff } from "@/lib/api/agent";
import { humanizeEnum, initials } from "@/lib/format";
import type { EmployeeSummaryResponse } from "@/types";

/**
 * Agent Portal — deployed staff roster, from `GET /employees/by-agent/{id}`.
 * The agent id comes from the session; the backend re-checks `isSameAgent`.
 */

const STATUS_META: Record<string, { className: string; dotClassName: string }> = {
  ACTIVE: { className: "bg-tertiary-fixed/20 text-tertiary-container", dotClassName: "bg-tertiary-container" },
  INACTIVE: { className: "bg-surface-variant text-on-surface-variant", dotClassName: "bg-outline" },
  TERMINATED: { className: "bg-error-container/40 text-on-error-container", dotClassName: "bg-error" },
};

const FALLBACK_STATUS = STATUS_META.INACTIVE;

export default async function DeployedStaffPage() {
  const session = await requirePermission("agent:read:self");

  if (session.agentId === null) {
    return (
      <>
        <PageHeader title="My Deployed Staff" />
        <EmptyState
          symbol="link_off"
          title="Account not linked"
          description="Your login is not linked to an agent record. Contact the company's administrators."
        />
      </>
    );
  }

  let staff: EmployeeSummaryResponse[];
  try {
    staff = await getAgentStaff(session.agentId);
  } catch (error) {
    return (
      <DataUnavailable
        title="My Deployed Staff"
        subject="Your deployed staff"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const activeCount = staff.filter((person) => person.employmentStatus === "ACTIVE").length;

  return (
    <>
      <PageHeader
        title="My Deployed Staff"
        description={`${activeCount} active of ${staff.length} staff placed through your agency.`}
      />

      <div className="flex min-h-[300px] flex-col rounded-card border border-line bg-surface-container-lowest shadow-ambient-1">
        <div className="border-b border-line p-4 sm:p-card-padding">
          <h2 className="text-lg font-bold text-on-surface">Roster</h2>
        </div>

        {staff.length === 0 ? (
          <EmptyState symbol="group" title="No staff deployed yet" description="Staff assigned to your agency by HR appear here." className="m-4 border-0" />
        ) : (
          <div className="w-full flex-1 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-surface-container-low font-table-header uppercase text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold">Position</th>
                  <th className="px-6 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-body-md text-sm text-on-surface">
                {staff.map((person) => {
                  const status = STATUS_META[person.employmentStatus] ?? FALLBACK_STATUS;
                  return (
                    <tr key={person.id} className={person.employmentStatus === "ACTIVE" ? "" : "opacity-70"}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {initials(person.fullName)}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface">{person.fullName}</div>
                            <div className="text-xs text-outline">ID: {person.employeeNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant">{person.branchName ?? "—"}</td>
                      <td className="px-6 py-3">{person.position ?? "—"}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          <span className={`size-1.5 rounded-full ${status.dotClassName}`} />
                          {humanizeEnum(person.employmentStatus)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}