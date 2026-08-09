import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import type { LeaveTypeRecord } from "@/types";

/**
 * Leave type catalogue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.LeaveTypeRecord`, plus the
 * carryForward/requiresDocument/status columns the list view needs, which
 * the backend will have to supply as a projection. Swap for
 * `await api.get<LeaveTypeRecord[]>("/leave/types")` when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type LeaveTypeRow = LeaveTypeRecord & {
  code: string;
  carryForwardDays: number;
  requiresDocument: boolean;
  status: "ACTIVE" | "INACTIVE";
};

const LEAVE_TYPES: readonly LeaveTypeRow[] = [
  { id: 1, name: "Annual Leave", code: "AL", defaultEntitlementDays: 21, paid: true, carryForwardDays: 5, requiresDocument: false, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 2, name: "Sick Leave", code: "SL", defaultEntitlementDays: 30, paid: true, carryForwardDays: 0, requiresDocument: true, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 3, name: "Compassionate", code: "CL", defaultEntitlementDays: 5, paid: true, carryForwardDays: 0, requiresDocument: false, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 4, name: "Maternity", code: "ML", defaultEntitlementDays: 90, paid: true, carryForwardDays: 0, requiresDocument: true, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 5, name: "Paternity", code: "PL", defaultEntitlementDays: 14, paid: true, carryForwardDays: 0, requiresDocument: true, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 6, name: "Unpaid Leave", code: "UL", defaultEntitlementDays: 0, paid: false, carryForwardDays: 0, requiresDocument: false, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
];

export default async function LeaveTypesPage() {
  await requirePermission("leave:type:manage");

  return (
    <>
      <PageHeader
        title="Leave Types"
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <Icon name="add" className="text-[18px]" />
            Add Leave Type
          </button>
        }
      />

      <BentoCard title={null}>
        <div className="w-full overflow-x-auto">
          <table className="data-table w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Name</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-outline">Code</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-outline">Annual Entitlement</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-outline">Carry Forward (days)</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-outline">Requires Document</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-outline">Paid</th>
                <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {LEAVE_TYPES.map((type) => (
                <tr key={type.id}>
                  <td className="py-4 pl-2 font-medium text-on-surface">{type.name}</td>
                  <td className="py-4 text-on-surface-variant">{type.code}</td>
                  <td className="py-4 text-on-surface">
                    {type.defaultEntitlementDays === 0 ? "—" : `${type.defaultEntitlementDays} Days`}
                  </td>
                  <td className="py-4 text-on-surface">{type.carryForwardDays} Days</td>
                  <td className="py-4 text-on-surface">{type.requiresDocument ? "Yes" : "No"}</td>
                  <td className="py-4 text-on-surface">{type.paid ? "Yes" : "No"}</td>
                  <td className="py-4 pr-2 text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-soft px-2 py-1 text-[10px] font-semibold text-primary-container">
                      {type.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </>
  );
}