import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getLeaveTypes } from "@/lib/api/leave";
import { formatNumber } from "@/lib/format";
import type { LeaveTypeResponse } from "@/types";

/**
 * Leave types, read-only.
 *
 * `roles.ts` gives HR_MANAGER a `leave:type:manage` permission, but no endpoint
 * backs it: `LeaveController` exposes `GET /leave/types` and nothing that
 * creates, edits or deletes a type. There is nowhere to POST to, so this screen
 * deliberately has no add/edit controls rather than buttons that would fail.
 *
 * A create endpoint is a backend addition, and until it exists the honest thing
 * is to show the configured types and say they are fixed.
 */
export default async function LeaveTypesPage() {
  await requirePermission("leave:read");

  let types: LeaveTypeResponse[];

  try {
    types = await getLeaveTypes();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Leave Types"
        description="The leave categories employees can request against."
        subject="The leave type list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Leave Types"
        description="The leave categories employees can request against."
      />

      <BentoCard
        title={
          <span className="flex items-center gap-2">
            <Icon name="category" className="text-[20px] text-primary" />
            Configured Types
          </span>
        }
        action={
          <span className="font-body-md text-[11px] text-outline">
            {formatNumber(types.length)}{" "}
            {types.length === 1 ? "type" : "types"}
          </span>
        }
      >
        {types.length === 0 ? (
          <EmptyState
            symbol="event_busy"
            title="No leave types configured"
            description="Leave types are set up in the database; the API has no endpoint to create one."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Default Entitlement</th>
                  <th className="pb-3 text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {types.map((type) => (
                  <tr
                    key={type.id}
                    className="border-b border-outline-variant/25 last:border-0"
                  >
                    <td className="py-3 pr-4 font-semibold text-on-surface">
                      {type.name}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {type.defaultEntitlementDays === null
                        ? "Not set"
                        : `${formatNumber(type.defaultEntitlementDays)} days`}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          type.paid
                            ? "bg-tertiary-container/15 text-tertiary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {type.paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>

      <p className="mt-4 text-[11px] text-outline">
        Read-only. The API can list leave types but has no endpoint to create,
        edit or remove one — adding a type is a database change today.
      </p>
    </>
  );
}
