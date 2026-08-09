import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";
import type { Branch } from "@/types";

/**
 * Branch detail.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Branch`, plus manager,
 * department roster, and device list the detail view needs as a
 * projection. Swap for `await api.get<Branch>(`/branches/${id}`)` when
 * ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BRANCH: Branch & {
  employeeCount: number;
  departmentCount: number;
  deviceCount: number;
  managerName: string;
  managerEmail: string;
  managerSince: string;
} = {
  id: 1,
  name: "Nairobi CBD Branch",
  code: "NBO-01",
  address: null,
  phone: null,
  email: null,
  managerId: 22,
  status: "ACTIVE",
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  employeeCount: 120,
  departmentCount: 4,
  deviceCount: 15,
  managerName: "Sarah Wanji",
  managerEmail: "sarah.w@dhwarsh.com",
  managerSince: "Jan 2024",
};

const DEPARTMENTS = [
  { id: 1, name: "Operations", head: "John Mutua", initials: "JM", tone: "text-primary-container bg-blue-soft", staff: 45 },
  { id: 2, name: "Sales", head: "Alice Kamau", initials: "AK", tone: "text-tertiary bg-tertiary-container/20", staff: 32 },
  { id: 3, name: "IT Support", head: "David Ochieng", initials: "DO", tone: "text-primary-container bg-primary-container/20", staff: 28 },
  { id: 4, name: "HR", head: "Sarah Wanji", initials: "SW", tone: "text-error bg-error-container", staff: 15 },
] as const;

const DEVICES = [
  { id: 1, name: "Bio-Entry Main", serial: "DHW-BE-1029", online: true },
  { id: 2, name: "Bio-Exit Staff", serial: "DHW-BE-1030", online: true },
  { id: 3, name: "TimeClock HR", serial: "DHW-TC-4011", online: false },
] as const;

export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("branch:write");
  const { id } = await params;
  const branch = BRANCH; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button type="button" className="flex size-9 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-ambient-1 transition-colors hover:text-primary">
              <Icon name="arrow_back_ios_new" />
            </button>
            {branch.name}
            <span className="flex items-center gap-1 rounded-full border border-[#ceead6] bg-[#e6f4ea] px-3 py-1 font-body-md text-body-md font-semibold text-[#137333]">
              <span className="size-2 rounded-full bg-[#137333]" />
              Active
            </span>
          </span>
        }
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-6 py-2.5 font-body-md text-body-md font-semibold text-white shadow-ambient-1 transition-colors hover:bg-primary"
          >
            <Icon name="edit" className="text-[18px]" />
            Edit Branch
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
            <BentoCard title={null} className="relative overflow-hidden">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface-variant">Employees</h3>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
                  <Icon name="badge" className="text-[18px]" />
                </span>
              </div>
              <div className="font-card-stat text-card-stat text-on-primary-fixed-variant">{formatNumber(branch.employeeCount)}</div>
            </BentoCard>
            <BentoCard title={null}>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface-variant">Departments</h3>
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-soft text-primary-container">
                  <Icon name="corporate_fare" className="text-[18px]" />
                </span>
              </div>
              <div className="font-card-stat text-card-stat text-on-primary-fixed-variant">{formatNumber(branch.departmentCount)}</div>
            </BentoCard>
            <BentoCard title={null}>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface-variant">Devices</h3>
                <span className="flex size-8 items-center justify-center rounded-full bg-tertiary-container/10 text-tertiary-container">
                  <Icon name="fingerprint" className="text-[18px]" />
                </span>
              </div>
              <div className="font-card-stat text-card-stat text-on-primary-fixed-variant">{formatNumber(branch.deviceCount)}</div>
            </BentoCard>
          </div>

          <BentoCard
            title="Departments"
            action={
              <button type="button" className="flex items-center gap-1 font-body-md text-body-md font-medium text-primary-container hover:underline">
                View All
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Name</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Head of Dept</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Staff Count</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {DEPARTMENTS.map((dept) => (
                    <tr key={dept.id}>
                      <td className="py-3 pl-2 font-medium text-on-primary-fixed-variant">{dept.name}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-2">
                          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${dept.tone}`}>
                            {dept.initials}
                          </span>
                          {dept.head}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">{dept.staff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title={null} className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <span
                aria-hidden
                className="flex size-24 items-center justify-center rounded-full border-4 border-white bg-secondary-container text-2xl font-bold text-primary shadow-ambient-1"
              >
                {branch.managerName.split(" ").map((n) => n[0]).join("")}
              </span>
              <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-white bg-[#137333]" />
            </div>
            <h2 className="mb-1 font-page-title text-page-title text-on-primary-fixed-variant">{branch.managerName}</h2>
            <p className="mb-3 flex items-center justify-center gap-1 font-body-md text-body-md text-on-surface-variant">
              <Icon name="mail" className="text-[16px]" />
              {branch.managerEmail}
            </p>
            <div className="my-2 h-px w-full bg-outline-variant/30" />
            <p className="mt-2 font-label-rail text-label-rail uppercase tracking-wider text-on-surface-variant">
              Manager since {branch.managerSince}
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-blue-soft py-2 font-body-md text-body-md font-semibold text-primary-container transition-colors hover:bg-primary-container/20"
            >
              Contact Manager
            </button>
          </BentoCard>

          <BentoCard title="Assigned Devices" action={<span className="rounded-full bg-surface-container px-2 py-1 font-label-rail text-label-rail text-on-surface-variant">{DEVICES.length} Total</span>}>
            <ul className="flex flex-col gap-1">
              {DEVICES.map((device) => (
                <li key={device.id}>
                  <div
                    className={
                      device.online
                        ? "flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-outline-variant/30 hover:bg-surface-container-low"
                        : "flex items-center justify-between rounded-lg border border-error/20 bg-[#fff4f2] p-3 transition-colors hover:bg-[#ffeceb]"
                    }
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={
                          device.online
                            ? "flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary"
                            : "flex size-10 items-center justify-center rounded-lg bg-white text-error shadow-sm"
                        }
                      >
                        <Icon name={device.online ? "dns" : "warning"} />
                      </span>
                      <span>
                        <span className={`block font-body-md text-body-md font-semibold ${device.online ? "text-on-primary-fixed-variant" : "text-error"}`}>
                          {device.name}
                        </span>
                        <span className={`mt-0.5 block font-label-rail text-label-rail font-mono ${device.online ? "text-on-surface-variant" : "text-error/70"}`}>
                          SN: {device.serial}
                        </span>
                      </span>
                    </span>
                    <span className={`size-2.5 rounded-full ${device.online ? "bg-[#137333]" : "animate-pulse bg-error"}`} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-outline-variant/50 pt-3">
              <button type="button" className="w-full py-1 text-center font-body-md text-body-md text-primary-container hover:underline">
                Manage Devices
              </button>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}