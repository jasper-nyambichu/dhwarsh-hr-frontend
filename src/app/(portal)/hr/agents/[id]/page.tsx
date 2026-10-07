import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getAgent, getAgentStaff } from "@/lib/api/agent";
import { formatDate, formatMoney, formatNumber, humanizeEnum, initials } from "@/lib/format";
import type { AgentResponse, EmployeeSummaryResponse } from "@/types";

/**
 * One labour agent, read-only.
 *
 * HR can read an agent but not write one — `POST`/`PUT /agents` are
 * SUPER_ADMIN/ADMIN and `PUT /agents/{id}/deactivate` is SUPER_ADMIN alone.
 * Contract terms are therefore labels, never inputs.
 *
 * The old placeholder's "Outstanding Advances" card and "Recent Invoices" list
 * are gone. Both were invented: advances and invoices are their own modules with
 * their own endpoints, and neither is exposed per-agent to HR, so there is
 * nothing to total. The side column shows the contact and banking details the
 * agent record actually carries instead.
 */
export default async function HrAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("agent:read");

  const { id } = await params;
  const agentId = Number(id);

  if (!Number.isInteger(agentId) || agentId <= 0) {
    notFound();
  }

  let agent: AgentResponse;
  let staff: EmployeeSummaryResponse[];

  try {
    // Sequential rather than parallel: a 404 on the agent means the staff call
    // is pointless, and the staff read is the one that can 403 for a role that
    // may still read the agent itself.
    agent = await getAgent(agentId);
    staff = await getAgentStaff(agentId);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    if (error instanceof ApiError && error.isNotFound) {
      notFound();
    }

    return (
      <DataUnavailable
        title="Labour Agent"
        description="One external staff supplier."
        subject="This agent"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {agent.name}
            <StatusBadge status={agent.status} />
          </span>
        }
        description={agent.contactPerson ?? "No contact person on file."}
        actions={
          <Link
            href="/hr/agents"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Icon name="arrow_back" className="text-[18px]" />
            All agents
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="groups" className="text-[20px] text-primary" />
                Deployed Staff
              </span>
            }
            action={
              <span className="font-body-md text-[11px] text-outline">
                {formatNumber(staff.length)}{" "}
                {staff.length === 1 ? "employee" : "employees"}
              </span>
            }
          >
            {staff.length === 0 ? (
              <EmptyState
                symbol="person_off"
                title="No staff deployed"
                description="No employee record currently points at this agent."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-body-md">
                  <thead>
                    <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                      <th className="pb-3 pr-4">Employee</th>
                      <th className="pb-3 pr-4">Branch</th>
                      <th className="pb-3 pr-4">Position</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-outline-variant/25 last:border-0 hover:bg-surface-container-low/40"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/hr/employees/${employee.id}`}
                            className="group flex items-center gap-3"
                          >
                            <span
                              aria-hidden
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-[10px] font-bold text-primary"
                            >
                              {initials(employee.fullName)}
                            </span>
                            <span>
                              <span className="block font-medium text-on-surface group-hover:text-primary">
                                {employee.fullName}
                              </span>
                              <span className="block text-[10px] text-outline">
                                {employee.employeeNumber}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">
                          {employee.branchName ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">
                          {employee.position ?? "—"}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={employee.employmentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="description" className="text-[20px] text-primary" />
                Contract Terms
              </span>
            }
            action={
              <span className="font-body-md text-[11px] text-outline">
                Read-only
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <ReadOnlyField
                label="Charge Type"
                value={humanizeEnum(agent.chargeType)}
              />
              <ReadOnlyField
                label="Charge Amount"
                value={
                  agent.chargeAmount === null
                    ? "Not set"
                    : `${formatMoney(agent.chargeAmount)}${
                        agent.chargeType === "PER_EMPLOYEE" ? " / employee" : ""
                      }`
                }
              />
              <ReadOnlyField
                label="Charge Percentage"
                value={
                  agent.chargePercentage === null
                    ? "Not set"
                    : `${agent.chargePercentage}%`
                }
              />
              <ReadOnlyField
                label="Contract Start"
                value={
                  agent.contractStartDate
                    ? formatDate(agent.contractStartDate)
                    : "Not set"
                }
              />
              <ReadOnlyField
                label="Contract End"
                value={
                  agent.contractEndDate ? formatDate(agent.contractEndDate) : "Open"
                }
              />
              <ReadOnlyField
                label="VAT Registered"
                value={
                  <span className="flex items-center gap-2">
                    <Icon
                      name={agent.vatRegistered ? "check_circle" : "cancel"}
                      className={`text-[16px] ${
                        agent.vatRegistered ? "text-tertiary" : "text-outline"
                      }`}
                    />
                    {agent.vatRegistered ? "Yes" : "No"}
                  </span>
                }
              />
            </div>

            <p className="mt-5 text-[11px] text-outline">
              HR can view these terms but not change them — editing an agent is
              an administrator action.
            </p>
          </BentoCard>
        </div>

        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="contacts" className="text-[20px] text-primary" />
                Contact
              </span>
            }
          >
            <dl className="flex flex-col gap-3">
              <DetailRow label="Contact Person" value={agent.contactPerson} />
              <DetailRow label="Phone" value={agent.phone} />
              <DetailRow label="Email" value={agent.email} />
              <DetailRow label="Address" value={agent.address} />
            </dl>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="account_balance" className="text-[20px] text-primary" />
                Banking & Statutory
              </span>
            }
          >
            <dl className="flex flex-col gap-3">
              <DetailRow label="Bank" value={agent.bankName} />
              <DetailRow label="Account Number" value={agent.bankAccountNumber} />
              <DetailRow label="KRA PIN" value={agent.kraPin} />
            </dl>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="receipt_long" className="text-[20px] text-primary" />
                Invoices & Advances
              </span>
            }
          >
            <p className="font-body-md text-body-md text-on-surface-variant">
              Not shown here. Agent invoices are produced by a payroll run and
              agent advances are their own module, each with its own status and
              history — neither is exposed as a per-agent total to HR.
            </p>
            <p className="mt-3 text-[11px] text-outline">
              Showing a figure here would mean inventing one. The agent&rsquo;s
              own portal and the payroll screens are where those numbers live.
            </p>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-table-header text-table-header uppercase text-outline">
        {label}
      </span>
      <span className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2 font-body-md text-body-md font-medium text-on-surface">
        {value}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="font-body-md text-[11px] uppercase tracking-wide text-outline">
        {label}
      </dt>
      <dd className="text-right font-body-md text-body-md text-on-surface">
        {value ?? "—"}
      </dd>
    </div>
  );
}
