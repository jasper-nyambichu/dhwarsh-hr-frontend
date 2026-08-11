import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import type { Agent } from "@/types";

/**
 * Agent organisation profile (company details, contacts, bank, documents).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Agent`, plus registration
 * number, contact designation, and document list the profile view needs
 * as a projection (not on the base Agent DTO). Swap for
 * `await api.get<Agent>("/agents/me")` when ready. Save Changes is not
 * yet wired to `PUT /agents/{id}`.
 * ─────────────────────────────────────────────────────────────────────────
 */

const AGENT: Agent & { registrationNo: string; designation: string; branchName: string } = {
  id: 1,
  name: "Acme Global Partners Ltd.",
  contactPerson: "David Ochieng",
  phone: "712 345 678",
  email: "admin@acmeglobal.co.ke",
  address: "4th Floor, Apex Tower, Westlands, Nairobi",
  bankName: "KCB Bank Kenya",
  bankAccountNumber: "1122334455",
  kraPin: null,
  contractStartDate: null,
  contractEndDate: null,
  chargeType: "PER_EMPLOYEE",
  chargeAmount: null,
  chargePercentage: null,
  vatRegistered: true,
  status: "ACTIVE",
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  registrationNo: "C-45892-2021",
  designation: "Managing Director",
  branchName: "Westlands",
};

const DOCUMENTS = [
  { id: 1, name: "Service_Level_Agreement.pdf", meta: "2.4 MB • Uploaded Jan 12, 2024", icon: "description" },
  { id: 2, name: "KRA_Compliance_Cert.pdf", meta: "1.1 MB • Valid till Dec 2024", icon: "verified" },
  { id: 3, name: "Certificate_of_Inc.pdf", meta: "850 KB • Permanent", icon: "apartment" },
] as const;

const inputClass =
  "input-field w-full rounded-lg border border-outline-variant/60 px-3.5 py-2.5 text-sm text-on-surface transition-all focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/10";

const labelClass = "mb-1.5 block text-xs font-semibold text-secondary";

export default async function AgentProfilePage() {
  await requirePermission("agent:read:self");
  const agent = AGENT;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-6">
            <span className="flex size-24 items-center justify-center rounded-2xl bg-white p-2 shadow-ambient-1">
              <Icon name="business" className="text-4xl text-primary" />
            </span>
            <span>
              <span className="flex items-center gap-3">
                <span className="text-2xl font-bold text-on-primary-fixed-variant">{agent.name}</span>
                <span className="rounded border border-orange/20 bg-orange/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange">
                  External Partner
                </span>
              </span>
              <span className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                <Icon name="location_on" className="text-[16px]" />
                Nairobi, Kenya
              </span>
            </span>
          </span>
        }
      />

      <form id="agent-profile-form" className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="business_center" className="text-primary-container" />
                Company Details
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Registered Company Name</label>
                <input className={inputClass} type="text" name="name" defaultValue={agent.name} />
              </div>
              <div>
                <label className={labelClass}>Registration Number</label>
                <input className={inputClass} type="text" name="registrationNo" defaultValue={agent.registrationNo} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Physical Address</label>
                <input className={inputClass} type="text" name="address" defaultValue={agent.address ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Primary Contact Person</label>
                <input className={inputClass} type="text" name="contactPerson" defaultValue={agent.contactPerson ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input className={inputClass} type="text" name="designation" defaultValue={agent.designation} />
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 flex flex-col lg:col-span-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="folder_shared" className="text-primary-container" />
                Contract Documents
              </span>
            }
            className="flex flex-1 flex-col"
          >
            <div className="flex flex-1 flex-col gap-3">
              {DOCUMENTS.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-3 transition-colors hover:bg-surface-container-low">
                  <span className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded bg-blue-soft text-primary-container">
                      <Icon name={doc.icon} className="text-[18px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-on-surface">{doc.name}</span>
                      <span className="block text-[10px] text-on-surface-variant">{doc.meta}</span>
                    </span>
                  </span>
                  <button type="button" className="p-1 text-primary-container opacity-0 transition-opacity group-hover:opacity-100">
                    <Icon name="download" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary-container py-2 text-sm font-medium text-primary-container transition-colors hover:bg-blue-soft"
            >
              <Icon name="upload" className="text-[18px]" />
              Upload New
            </button>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="contact_phone" className="text-primary-container" />
                Contact Information
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>Business Phone</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">+254</span>
                  <input className={`${inputClass} pl-12`} type="text" name="phone" defaultValue={agent.phone ?? ""} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Administrative Email</label>
                <input className={inputClass} type="email" name="email" defaultValue={agent.email ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Support Email (Optional)</label>
                <input className={inputClass} type="email" name="supportEmail" />
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="account_balance" className="text-orange" />
                Banking Details
              </span>
            }
            className="border-t-4 border-orange"
          >
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>Bank Name</label>
                <select className={`${inputClass} bg-white`} name="bankName" defaultValue={agent.bankName ?? ""}>
                  <option>Equity Bank Kenya</option>
                  <option>KCB Bank Kenya</option>
                  <option>Co-operative Bank</option>
                  <option>Standard Chartered</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Branch Name</label>
                  <input className={inputClass} type="text" name="bankBranch" defaultValue={agent.branchName} />
                </div>
                <div>
                  <label className={labelClass}>Branch Code</label>
                  <input className={inputClass} type="text" name="branchCode" defaultValue="01124" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input className={`${inputClass} font-mono`} type="text" name="bankAccountNumber" defaultValue={agent.bankAccountNumber ?? ""} />
              </div>
            </div>
          </BentoCard>
        </div>
      </form>

      {/* Sticky, not fixed: a fixed bar has to be told where the rail ends
          (`left-rail-width`), which silently breaks the moment the sidebar is
          expanded or the layout is viewed below md. Sticking to the bottom of
          the content column tracks the rail width for free. */}
      <div className="sticky bottom-0 z-40 -mx-4 mt-gutter flex flex-wrap justify-end gap-3 border-t border-outline-variant bg-white/80 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md sm:-mx-6 lg:-mx-container-margin">
        <button type="button" className="rounded-lg px-6 py-2 font-medium text-primary transition-colors hover:bg-blue-soft">
          Cancel
        </button>
        <button
          type="submit"
          form="agent-profile-form"
          className="rounded-lg bg-on-primary-fixed-variant px-6 py-2 font-medium text-white shadow-ambient-1 transition-colors hover:bg-primary"
        >
          Save Changes
        </button>
      </div>
    </>
  );
}