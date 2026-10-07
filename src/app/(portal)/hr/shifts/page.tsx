import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getShifts } from "@/lib/api/shift";
import { formatNumber, humanizeEnum } from "@/lib/format";
import type { ShiftResponse } from "@/types";

import { ShiftForm } from "./_components/shift-form";

/**
 * Shifts.
 *
 * The one HR module with no permission caveats — HR_MANAGER holds every mapping
 * on `ShiftController`, so reading and creating both work with no backend
 * change needed.
 *
 * Shifts are company-wide: there is no branch column on the `shifts` table. A
 * shift becomes branch-specific only when it is *assigned* (which is what the
 * roster screen does), not when it is defined.
 */
export default async function ShiftsPage() {
  await requirePermission("shift:read");

  let shifts: ShiftResponse[];

  try {
    shifts = await getShifts();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Shifts"
        description="The shift patterns work can be assigned to."
        subject="The shift list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Shifts"
        description="The shift patterns work can be assigned to."
        actions={
          <Link
            href="/hr/shifts/roster"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Icon name="calendar_view_week" className="text-[18px]" />
            View roster
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="schedule" className="text-[20px] text-primary" />
                Defined Shifts
              </span>
            }
            action={
              <span className="font-body-md text-[11px] text-outline">
                {formatNumber(shifts.length)}{" "}
                {shifts.length === 1 ? "shift" : "shifts"}
              </span>
            }
          >
            {shifts.length === 0 ? (
              <EmptyState
                symbol="schedule"
                title="No shifts defined"
                description="Create the first shift pattern using the form beside this table."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-body-md">
                  <thead>
                    <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Starts</th>
                      <th className="pb-3">Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr
                        key={shift.id}
                        className="border-b border-outline-variant/25 last:border-0"
                      >
                        <td className="py-3 pr-4 font-semibold text-on-surface">
                          {shift.name}
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">
                          {humanizeEnum(shift.type)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[12px] text-on-surface-variant">
                          {shift.startTime ? shift.startTime.slice(0, 5) : "—"}
                        </td>
                        <td className="py-3 font-mono text-[12px] text-on-surface-variant">
                          {shift.endTime ? shift.endTime.slice(0, 5) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        <div className="lg:col-span-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="add_circle" className="text-[20px] text-primary" />
                New Shift
              </span>
            }
          >
            <ShiftForm />
          </BentoCard>
        </div>
      </div>
    </>
  );
}
