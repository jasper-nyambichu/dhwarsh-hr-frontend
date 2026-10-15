"use client";

import { useActionState, useState } from "react";

import { runPayrollAction } from "@/app/actions/payroll";
import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

type Option = { id: number; name: string; hint?: string | null };

const INPUT =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";

function CheckGroup({ title, name, options }: { title: string; name: string; options: Option[] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{title}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-outline">None available</p>
      ) : (
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-outline-variant/40 p-2">
          {options.map((option) => (
            <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-container-low">
              <input type="checkbox" name={name} value={option.id} className="size-4 accent-primary" />
              <span className="text-on-surface">{option.name}</span>
              {option.hint ? <span className="text-xs text-outline">· {option.hint}</span> : null}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function RunPayrollForm({
  defaultStart,
  defaultEnd,
  branches,
  agents,
  departments,
}: {
  defaultStart: string;
  defaultEnd: string;
  branches: Option[];
  agents: Option[];
  departments: Option[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(runPayrollAction, {
    status: "idle",
  });
  const [scope, setScope] = useState<"all" | "custom">("all");

  const fieldError = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-3xl flex-col gap-gutter">
      <BentoCard title="Pay period">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-secondary">Period start</span>
            <input type="date" name="periodStart" defaultValue={defaultStart} required className={INPUT} />
            {fieldError("periodStart") ? <span className="text-xs text-error">{fieldError("periodStart")}</span> : null}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-secondary">Period end</span>
            <input type="date" name="periodEnd" defaultValue={defaultEnd} required className={INPUT} />
            {fieldError("periodEnd") ? <span className="text-xs text-error">{fieldError("periodEnd")}</span> : null}
          </label>
        </div>
        <p className="mt-3 text-xs text-on-surface-variant">
          Use one pay period per run (normally a calendar month). Unpaid leave is costed against the working days in this period.
        </p>
      </BentoCard>

      <BentoCard title="Who to pay">
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
            <input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} className="size-4 accent-primary" />
            All active employees
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
            <input type="radio" name="scope" value="custom" checked={scope === "custom"} onChange={() => setScope("custom")} className="size-4 accent-primary" />
            Selected branches, agents or departments
          </label>
        </div>

        {scope === "custom" ? (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <CheckGroup title="Branches" name="branchIds" options={branches} />
            <CheckGroup title="Agents" name="agentIds" options={agents} />
            <CheckGroup title="Departments" name="departmentIds" options={departments} />
          </div>
        ) : null}
      </BentoCard>

      <div className="flex items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
        <Icon name="info" className="mt-0.5 shrink-0 text-primary" />
        <p className="text-sm text-on-surface-variant">
          Running payroll calculates and saves payslips immediately, deducts loan instalments, recovers agent advances and produces each agent&apos;s documents. It cannot be undone, and an employee who already has a payslip for an overlapping period will block the run.
        </p>
      </div>

      {state.status === "error" ? (
        <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
          {state.message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="play_arrow" className="text-[18px]" />
          {pending ? "Running payroll…" : "Run Payroll"}
        </button>
      </div>
    </form>
  );
}