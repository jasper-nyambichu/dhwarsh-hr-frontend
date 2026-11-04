import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ApiError } from "@/app/lib/api-error";
import { DeactivateAgentButton } from "@/components/features/agents/deactivate-agent-button";
import { getCurrentUser, requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getAgent, getAgentStaff } from "@/lib/api/agent";
import {
  formatDate,
  formatMoney,
  formatNumber,
  initials,
} from "@/lib/format";
import type { AgentResponse, ChargeType, EmployeeSummaryResponse } from "@/types";

/**
 * Agent detail: contract terms and the staff that agent has deployed.
 *
 * Both reads exist today — `GET /agents/{id}` and `GET /employees/by-agent/{id}`
 * — so the roster and every contract field are live.
 *
 * Gated on `agent:read`, not `agent:write`: the backend opens this record to
 * PAYROLL_OFFICER as well, and a read page that bounces a role the API admits
 * is a bug in the gate, not in the API. The write controls are gated
 * individually instead, because the two writes have *different* audiences —
 * `PUT /agents/{id}` accepts ADMIN, `PUT /agents/{id}/deactivate` is
 * SUPER_ADMIN only.
 *
 * Two cards the placeholder carried are gone rather than stubbed: **outstanding
 * advances** (there is no agent-advance read on this endpoint and no
 * `/agent-advances` client module yet) and **invoice history** (no invoice
 * endpoint, and the placeholder linked into `/manager/*`, a namespace that does
 * not exist in this app).
 */

const CHARGE_TYPE_LABEL: Record<ChargeType, string> = {
  PER_EMPLOYEE: "Per Employee",
  PERCENTAGE_OF_GROSS: "Percentage of Gross",
  FIXED_MONTHLY: "Fixed Monthly",
  CUSTOM: "Custom",
};

/** The rate, read off whichever column the charge type actually uses. */
function chargeValue(agent: AgentResponse): string {
  switch (agent.chargeType) {
    case "PERCENTAGE_OF_GROSS":
      return agent.chargePercentage === null
        ? "—"
        : `${agent.chargePercentage.toFixed(2)}%`;
    case "PER_EMPLOYEE":
    case "FIXED_MONTHLY":
      return formatMoney(agent.chargeAmount);
    case "CUSTOM":
      return "Per contract";
  }
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-table-header text-table-header uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="font-body-md text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("agent:read");

  const { id } = await params;
  const agentId = Number(id);

  if (!Number.isInteger(agentId) || agentId <= 0) notFound();

  const viewer = await getCurrentUser();

  let agent: AgentResponse;
  let staff: EmployeeSummaryResponse[];

  try {
    [agent, staff] = await Promise.all([
      getAgent(agentId),
      getAgentStaff(agentId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");
    if (error instanceof ApiError && error.isNotFound) notFound();

    return (
      <DataUnavailable
        title="Labour Agent"
        description="Contract terms and deployed staff."
        subject="This agent"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const canEdit = viewer.role === "SUPER_ADMIN" || viewer.role === "ADMIN";
  const canDeactivate = canEdit;

  return (
    <>
      {/* ─────────────────────────────── page header ─────────────────── */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <Link
            href="/admin/agents"
            className="flex items-center justify-center rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
          >
            <Icon name="chevron_left" />
          </Link>
          <h1 className="min-w-0 break-words font-page-title text-page-title text-on-surface">
            {agent.name}
          </h1>
          <StatusBadge status={agent.status} />
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
          {canEdit ? (
            <Link
              href={`/admin/agents/${agent.id}/edit`}
              className="flex-1 rounded-lg bg-secondary-container px-4 py-2 text-center font-bold text-body-md text-primary-container transition-colors hover:bg-secondary-fixed sm:flex-none"
            >
              Edit Agent
            </Link>
          ) : null}
          {/* SUPER_ADMIN only — `deactivateAgent` is `hasRole('SUPER_ADMIN')`
              on the backend, so rendering this for ADMIN would be a button
              that always 403s. */}
          {canDeactivate && agent.status === "ACTIVE" ? (
            <DeactivateAgentButton id={agent.id} name={agent.name} />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title="Deployed Staff"
            subtitle={`${formatNumber(staff.length)} ${
              staff.length === 1 ? "employee" : "employees"
            } supplied by this agent`}
          >
            {staff.length === 0 ? (
              <EmptyState
                symbol="group_off"
                title="No staff deployed"
                description="Employees assigned to this agent will be listed here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-variant">
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        Employee
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        Branch
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        Position
                      </th>
                      <th className="px-4 py-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-surface-variant transition-colors last:border-0 hover:bg-background"
                      >
                        <td className="px-4 py-3">
                          <span className="block font-medium text-on-surface">
                            {employee.fullName}
                          </span>
                          <span className="block font-mono text-[10px] text-outline">
                            {employee.employeeNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {employee.branchName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {employee.position ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
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
            title="Contract Terms"
            subtitle={
              canEdit
                ? undefined
                : "Read-only — contract terms are edited by an administrator."
            }
          >
            {/* Read-only rather than a form: the update endpoint exists, but the
                server action that would persist it lands with the write batch.
                A form whose Save button does nothing is worse than a display. */}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <Field
                label="Charge Type"
                value={CHARGE_TYPE_LABEL[agent.chargeType]}
              />
              <Field label="Rate" value={chargeValue(agent)} />
              <Field
                label="VAT Registered"
                value={agent.vatRegistered ? "Yes" : "No"}
              />
              <Field label="KRA PIN" value={agent.kraPin ?? "—"} />
              <Field
                label="Contract Start"
                value={formatDate(agent.contractStartDate)}
              />
              <Field
                label="Contract End"
                value={formatDate(agent.contractEndDate)}
              />
            </dl>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Contact">
            <div className="flex flex-col items-center text-center">
              <span
                aria-hidden
                className="mb-4 flex size-20 items-center justify-center rounded-full border-4 border-white bg-secondary-container text-xl font-bold text-primary shadow-ambient-1"
              >
                {initials(agent.contactPerson ?? agent.name)}
              </span>
              <h2 className="font-body-md text-body-md font-semibold text-on-surface">
                {agent.contactPerson ?? "No contact person on file"}
              </h2>
            </div>

            <dl className="mt-4 flex flex-col gap-3 font-body-md text-body-md">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Phone</dt>
                <dd className="min-w-0 break-all text-right font-mono text-[11px] text-on-surface">
                  {agent.phone ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Email</dt>
                <dd className="min-w-0 break-all text-right text-on-surface">
                  {agent.email ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Address</dt>
                <dd className="min-w-0 break-words text-right text-on-surface">
                  {agent.address ?? "—"}
                </dd>
              </div>
            </dl>
          </BentoCard>

          <BentoCard title="Director">
            <dl className="flex flex-col gap-3 font-body-md text-body-md">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Name</dt>
                <dd className="min-w-0 break-words text-right text-on-surface">
                  {agent.directorName ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">ID photo</dt>
                <dd className="text-right">
                  {agent.directorIdOnFile ? (
                    <a
                      href={`/api/agents/${agent.id}/director-id`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      View photo
                    </a>
                  ) : (
                    <span className="text-amber-main">Not uploaded</span>
                  )}
                </dd>
              </div>
            </dl>
          </BentoCard>

          <BentoCard title="Settlement">
            <dl className="flex flex-col gap-3 font-body-md text-body-md">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Bank</dt>
                <dd className="text-right text-on-surface">
                  {agent.bankName ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Account</dt>
                <dd className="text-right font-mono text-[11px] text-on-surface">
                  {agent.bankAccountNumber ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Deployed</dt>
                <dd className="text-right font-semibold text-on-surface">
                  {formatNumber(agent.employeeCount ?? staff.length)}
                </dd>
              </div>
            </dl>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
