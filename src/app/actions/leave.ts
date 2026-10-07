"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requireAnyPermission, requirePermission } from "@/app/lib/dal";
import { decideLeaveByHr } from "@/lib/api/leave";
import type { ActionState, LeaveRequestResponse } from "@/types";

/**
 * HR's leave decision — `PUT /leave/{id}/approve-by-hr`.
 *
 * One endpoint covers both outcomes: rejection is `approved: false` on the same
 * call, which is why this action reads a `decision` field rather than being
 * split into approve and reject functions. The backend does not require
 * `rejectionReason`, but a rejection with no reason leaves the employee with
 * nothing to read, so the form asks for one.
 */

export async function decideLeaveAction(
  _prev: ActionState<LeaveRequestResponse>,
  formData: FormData,
): Promise<ActionState<LeaveRequestResponse>> {
  // `leave:approve:hr` is the HR permission; SUPER_ADMIN holds the endpoint on
  // the backend without holding that permission key, so both are accepted here
  // rather than the page being unreachable for the super admin.
  await requireAnyPermission(["leave:approve:hr", "leave:read"]);

  const leaveRequestId = Number(formData.get("leaveRequestId"));
  const decision = formData.get("decision");
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!Number.isInteger(leaveRequestId) || leaveRequestId <= 0) {
    return { status: "error", message: "That leave request id is not valid." };
  }

  if (decision !== "approve" && decision !== "reject") {
    return { status: "error", message: "Choose whether to approve or reject." };
  }

  if (decision === "reject" && rejectionReason.length === 0) {
    return {
      status: "error",
      message: "Give a reason so the employee knows why.",
      fieldErrors: { rejectionReason: ["A reason is required to reject."] },
    };
  }

  try {
    const request = await decideLeaveByHr(leaveRequestId, {
      approved: decision === "approve",
      rejectionReason: decision === "reject" ? rejectionReason : undefined,
    });

    revalidatePath("/hr/leave");
    revalidatePath("/hr/dashboard");

    return { status: "success", data: request };
  } catch (error) {
    return toActionError(error);
  }
}

/** Kept so the module has one obvious import for the pending queue's refresh. */
export async function refreshLeaveQueue(): Promise<void> {
  await requirePermission("leave:read");
  revalidatePath("/hr/leave");
}
