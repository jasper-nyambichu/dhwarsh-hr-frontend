import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyAgent } from "@/lib/api/agent";
import { chargeSummary } from "@/lib/agent-format";
import { formatDate, formatNumber, humanizeEnum } from "@/lib/format";

/**
 * Agent organisation profile — read-only. Profile changes go through the
 * company's administrators (`PUT /agents/{id}` is SUPER_ADMIN / ADMIN only).
 */

function Field({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-secondary">{label}</p>
      <p className={`break-words text-sm text-on-surface ${mono ? "font-mono" : ""}`}>{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export default async function AgentProfilePage() {
  await requirePermission("agent:read:self");

  let agent: Awaited<ReturnType<typeof getMyAgent>>;
  try {
    agent = await getMyAgent();
  } catch (error) {
    return (
      <DataUnavailable
        title="Profile"
        subject="Your profile"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3 sm:gap-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-ambient-1 sm:size-24">
              <Icon name="business" className="text-4xl text-primary" />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 break-words text-xl font-bold text-on-primary-fixed-variant sm:text-2xl">{agent.name}</span>
                <span className="rounded border border-orange/20 bg-orange/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange">
                  {humanizeEnum(agent.status)}
                </span>
              </span>
              <span className="mt-1 block text-sm text-on-surface-variant">
                {formatNumber(agent.employeeCount)} active employees
              </span>
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 min-w-0 lg:col-span-6">
          <BentoCard title="Company Details">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Registered Company Name" value={agent.name} />
              <Field label="KRA PIN" value={agent.kraPin} mono />
              <div className="md:col-span-2">
                <Field label="Physical Address" value={agent.address} />
              </div>
              <Field label="Primary Contact Person" value={agent.contactPerson} />
              <Field label="VAT Registered" value={agent.vatRegistered ? "Yes" : "No"} />
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 min-w-0 lg:col-span-6">
          <BentoCard title="Contact Information">
            <div className="grid grid-cols-1 gap-6">
              <Field label="Business Phone" value={agent.phone} />
              <Field label="Administrative Email" value={agent.email} />
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 min-w-0 lg:col-span-6">
          <BentoCard title="Banking Details" className="border-t-4 border-orange">
            <div className="grid grid-cols-1 gap-6">
              <Field label="Bank Name" value={agent.bankName} />
              <Field label="Account Number" value={agent.bankAccountNumber} mono />
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 min-w-0 lg:col-span-6">
          <BentoCard title="Contract & Charges">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Contract Start" value={formatDate(agent.contractStartDate)} />
              <Field label="Contract End" value={formatDate(agent.contractEndDate)} />
              <div className="md:col-span-2">
                <Field label="Service Charge" value={chargeSummary(agent)} />
              </div>
            </div>
          </BentoCard>
        </div>
      </div>

      <div className="mt-gutter flex items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
        <Icon name="info" className="mt-0.5 shrink-0 text-primary" />
        <p className="text-sm text-on-surface-variant">
          To change any of these details, contact the company&apos;s administrators.
        </p>
      </div>
    </>
  );
}