//src/app/(portal)/manager/agents/[id]/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";

/**
 * Staffing agent detail: deployed staff + editable contract terms.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.StaffingAgent` +
 * `types.AgentContract` + `types.Invoice`. `params.id` identifies the agent;
 * currently unused beyond driving the fetch stub. Contract form is
 * uncontrolled — wire a server action to the "Save Changes" button once the
 * update endpoint exists.
 * ─────────────────────────────────────────────────────────────────────────
 */

type DeployedStaffRow = {
  id: number;
  name: string;
  initials: string;
  branch: string;
  role: string;
  rateLabel: string;
  status: "ACTIVE" | "ON_LEAVE";
};

type InvoiceRow = { id: string; date: string; amountLabel: string; status: "PAID" };

type AgentDetail = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  outstandingAdvancesLabel: string;
  contract: {
    chargeType: "Fixed Amount" | "Percentage" | "Per-Employee";
    chargeAmount: number;
    vatRegistered: boolean;
    startDate: string;
    endDate: string;
  };
  deployedStaff: DeployedStaffRow[];
  invoices: InvoiceRow[];
};

async function getAgent(id: string): Promise<AgentDetail> {
  // TODO: replace with a real fetch keyed on `id`.
  return {
    id,
    name: "Strategic Labour Ltd",
    status: "ACTIVE",
    outstandingAdvancesLabel: "KES 45,000",
    contract: { chargeType: "Per-Employee", chargeAmount: 1500, vatRegistered: true, startDate: "2023-01-01", endDate: "2025-12-31" },
    deployedStaff: [
      { id: 1, name: "John Doe", initials: "JD", branch: "Nairobi HQ", role: "Security Guard", rateLabel: "1,200", status: "ACTIVE" },
      { id: 2, name: "Jane Smith", initials: "JS", branch: "Mombasa Port", role: "Cleaner", rateLabel: "850", status: "ACTIVE" },
      { id: 3, name: "Michael Kip", initials: "MK", branch: "Nakuru Branch", role: "Driver", rateLabel: "1,500", status: "ON_LEAVE" },
    ],
    invoices: [
      { id: "INV-2023-08", date: "Aug 31, 2023", amountLabel: "KES 142k", status: "PAID" },
      { id: "INV-2023-07", date: "Jul 31, 2023", amountLabel: "KES 138k", status: "PAID" },
      { id: "INV-2023-06", date: "Jun 30, 2023", amountLabel: "KES 145k", status: "PAID" },
    ],
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agent:write");
  const { id } = await params;
  const agent = await getAgent(id);

  return (
    <>
      {/* ─────────────────────────────── page header ─────────────────── */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/manager/agents"
            className="flex items-center justify-center rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
          >
            <Icon name="chevron_left" />
          </Link>
          <h1 className="font-page-title text-page-title text-on-surface">{agent.name}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              agent.status === "ACTIVE" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-variant text-on-surface-variant"
            }`}
          >
            {agent.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button className="flex-1 rounded-lg bg-secondary-container px-4 py-2 text-center font-bold text-body-md text-primary-container transition-colors hover:bg-secondary-fixed sm:flex-none">
            Edit Agent
          </button>
          <button className="flex-1 rounded-lg border border-error px-4 py-2 text-center font-bold text-body-md text-error transition-colors hover:bg-error-container sm:flex-none">
            Deactivate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title="Deployed Staff"
            action={
              <Link
                href={`/manager/agents/${agent.id}/staff`}
                className="flex items-center gap-1 text-body-md font-semibold text-primary-container transition-colors hover:text-primary"
              >
                View All
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-variant">
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Branch</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Role</th>
                    <th className="px-4 py-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Rate (KES)</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.deployedStaff.map((staff, index) => (
                    <tr
                      key={staff.id}
                      className={`transition-colors hover:bg-background ${index < agent.deployedStaff.length - 1 ? "border-b border-surface-variant" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-on-surface">{staff.name}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{staff.branch}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{staff.role}</td>
                      <td className="px-4 py-3 text-right font-medium">{staff.rateLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`mr-2 inline-block size-2 rounded-full ${staff.status === "ACTIVE" ? "bg-tertiary-fixed" : "bg-error"}`} />
                        {staff.status === "ACTIVE" ? "Active" : "Leave"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>

          <BentoCard
            title="Contract Terms"
            action={
              <button className="rounded-lg bg-primary px-3 py-1.5 text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant">
                Save Changes
              </button>
            }
          >
            <form className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="chargeType" className="font-table-header text-table-header uppercase text-on-surface-variant">
                  Charge Type
                </label>
                <select
                  id="chargeType"
                  name="chargeType"
                  defaultValue={agent.contract.chargeType}
                  className="w-full rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Fixed Amount">Fixed Amount</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Per-Employee">Per-Employee</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="chargeAmount" className="font-table-header text-table-header uppercase text-on-surface-variant">
                  Charge Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-on-surface-variant">KES</span>
                  <input
                    id="chargeAmount"
                    name="chargeAmount"
                    type="number"
                    defaultValue={agent.contract.chargeAmount}
                    className="w-full rounded-lg border border-surface-variant bg-surface-container-lowest py-2 pl-12 pr-3 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1 md:col-span-2">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-variant bg-surface-container-low/50 p-3 transition-colors hover:bg-surface-container-low">
                  <div>
                    <span className="block text-[14px] font-medium text-on-surface">VAT-Registered</span>
                    <span className="text-body-md text-on-surface-variant">Applies standard VAT rates to agent invoices.</span>
                  </div>
                  <div className="relative">
                    <input type="checkbox" name="vatRegistered" defaultChecked={agent.contract.vatRegistered} className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-surface-variant transition-colors after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </div>
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <label htmlFor="startDate" className="font-table-header text-table-header uppercase text-on-surface-variant">
                  Contract Start
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={agent.contract.startDate}
                  className="w-full rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <label htmlFor="endDate" className="font-table-header text-table-header uppercase text-on-surface-variant">
                  Contract End
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={agent.contract.endDate}
                  className="w-full rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </form>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-card bg-surface-container-lowest p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)]">
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-error-container opacity-20" />
            <div className="relative z-10 mb-4 flex items-start justify-between">
              <span className="font-table-header text-table-header uppercase text-on-surface-variant">Outstanding Advances</span>
              <div className="flex size-8 items-center justify-center rounded-full bg-error-container text-on-error-container">
                <Icon name="account_balance_wallet" className="text-[18px]" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="mb-1 font-card-stat text-card-stat text-on-surface">{agent.outstandingAdvancesLabel}</div>
              <div className="flex items-center gap-1 text-[10px] font-medium text-error">
                <Icon name="warning" className="text-[12px]" />
                Requires Settlement
              </div>
            </div>
          </div>

          <BentoCard
            title="Invoice History"
            action={
              <button className="text-on-surface-variant transition-colors hover:text-primary">
                <Icon name="more_horiz" className="text-[18px]" />
              </button>
            }
          >
            <div className="flex flex-col gap-3">
              {agent.invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/manager/invoices/${invoice.id}`}
                  className="group flex items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-surface-variant hover:bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded bg-surface-container-low text-primary">
                      <Icon name="receipt_long" className="text-[16px]" />
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-on-surface">{invoice.id}</div>
                      <div className="text-[10px] text-on-surface-variant">{invoice.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-medium text-on-surface">{invoice.amountLabel}</div>
                    <div className="text-[10px] font-medium text-tertiary-fixed-dim">Paid</div>
                  </div>
                </Link>
              ))}
            </div>
            <button className="mt-4 w-full rounded-lg py-2 text-center text-body-md font-semibold text-primary-container transition-colors hover:bg-surface-container-low">
              View Full Ledger
            </button>
          </BentoCard>
        </div>
      </div>
    </>
  );
}