"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requireAnyPermission, requirePermission } from "@/app/lib/dal";
import { decideLeaveByHr, decideLeaveByManager } from "@/lib/api/leave";
import type { ActionState, LeaveRequestResponse } from "@/types";

type Decision =
  | { ok: true; leaveRequestId: number; approved: boolean; rejectionReason?: string }
  | { ok: false; state: ActionState<LeaveRequestResponse> };

function readDecision(formData: FormData): Decision {
  const leaveRequestId = Number(formData.get("leaveRequestId"));
  const decision = formData.get("decision");
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!Number.isInteger(leaveRequestId) || leaveRequestId <= 0) {
    return { ok: false, state: { status: "error", message: "That leave request id is not valid." } };
  }
  if (decision !== "approve" && decision !== "reject") {
    return { ok: false, state: { status: "error", message: "Choose whether to approve or reject." } };
  }
  if (decision === "reject" && rejectionReason.length === 0) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Give a reason so the employee knows why.",
        fieldErrors: { rejectionReason: ["A reason is required to reject."] },
      },
    };
  }

  return {
    ok: true,
    leaveRequestId,
    approved: decision === "approve",
    rejectionReason: decision === "reject" ? rejectionReason : undefined,
  };
}

/** Legacy HR Manager decision (kept so existing HR accounts keep working). */
export async function decideLeaveAction(
  _prev: ActionState<LeaveRequestResponse>,
  formData: FormData,
): Promise<ActionState<LeaveRequestResponse>> {
  await requireAnyPermission(["leave:approve:hr", "leave:read"]);

  const parsed = readDecision(formData);
  if (!parsed.ok) return parsed.state;

  try {
    const request = await decideLeaveByHr(parsed.leaveRequestId, {
      approved: parsed.approved,
      rejectionReason: parsed.rejectionReason,
    });

    revalidatePath("/branch/approvals");

    return { status: "success", data: request };
  } catch (error) {
    return toActionError(error);
  }
}

/** Admin: the final decision on a leave request the Branch Manager has already passed on. */
export async function decideLeaveFinalAction(
  _prev: ActionState<LeaveRequestResponse>,
  formData: FormData,
): Promise<ActionState<LeaveRequestResponse>> {
  await requirePermission("leave:approve:hr");

  const parsed = readDecision(formData);
  if (!parsed.ok) return parsed.state;

  try {
    const request = await decideLeaveByHr(parsed.leaveRequestId, {
      approved: parsed.approved,
      rejectionReason: parsed.rejectionReason,
    });

    revalidatePath("/branch/approvals");

    return { status: "success", data: request };
  } catch (error) {
    return toActionError(error);
  }
}

/** Branch Manager: first-stage decision. Approving passes it to the Admin; rejecting ends it. */
export async function decideLeaveByManagerAction(
  _prev: ActionState<LeaveRequestResponse>,
  formData: FormData,
): Promise<ActionState<LeaveRequestResponse>> {
  await requirePermission("leave:approve:manager");

  const parsed = readDecision(formData);
  if (!parsed.ok) return parsed.state;

  try {
    const request = await decideLeaveByManager(parsed.leaveRequestId, {
      approved: parsed.approved,
      rejectionReason: parsed.rejectionReason,
    });

    revalidatePath("/branch/approvals");
    revalidatePath("/branch/dashboard");
    revalidatePath("/branch/approvals");

    return { status: "success", data: request };
  } catch (error) {
    return toActionError(error);
  }
}

/** Refreshes the leave queue. */
export async function refreshLeaveQueue(): Promise<void> {
  await requirePermission("leave:read");
  revalidatePath("/branch/approvals");
}