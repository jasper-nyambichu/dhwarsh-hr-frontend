"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { flashToast } from "@/app/lib/flash";
import { createAgent, deactivateAgent, getAgent, updateAgent, uploadDirectorId, type AgentInput } from "@/lib/api/agent";
import type { ActionState, ChargeType } from "@/types";

const FEE_TYPES: ChargeType[] = ["FIXED_MONTHLY", "PER_EMPLOYEE", "PERCENTAGE_OF_GROSS", "CUSTOM"];

type Parsed =
  | { ok: true; fields: Pick<AgentInput, "name" | "phone" | "email" | "address" | "directorName" | "chargeType" | "chargeAmount" | "chargePercentage">; photo: File | null }
  | { ok: false; state: ActionState };

function readAgent(formData: FormData): Parsed {
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const name = text("name");
  const phone = text("phone");
  const email = text("email");
  const address = text("address");
  const directorName = text("directorName");
  const chargeType = text("chargeType") as ChargeType;
  const fee = Number(text("serviceFee"));
  const photo = formData.get("directorIdPhoto");

  const fieldErrors: Record<string, string[]> = {};
  if (!name) fieldErrors.name = ["Required"];
  if (!phone) fieldErrors.phone = ["Required"];
  if (!email) fieldErrors.email = ["Required"];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ["Not a valid email"];
  if (!address) fieldErrors.address = ["Required"];
  if (!directorName) fieldErrors.directorName = ["Required"];
  if (!FEE_TYPES.includes(chargeType)) fieldErrors.chargeType = ["Choose how the fee is charged"];
  if (text("serviceFee") === "" || !Number.isFinite(fee) || fee < 0) fieldErrors.serviceFee = ["Enter 0 or more"];
  else if (chargeType === "PERCENTAGE_OF_GROSS" && fee > 100) fieldErrors.serviceFee = ["Cannot exceed 100%"];

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { status: "error", message: "Check the fields below.", fieldErrors } };
  }

  const percentage = chargeType === "PERCENTAGE_OF_GROSS";
  return {
    ok: true,
    fields: {
      name,
      phone,
      email,
      address,
      directorName,
      chargeType,
      chargeAmount: percentage ? null : fee,
      chargePercentage: percentage ? fee : null,
    },
    photo: photo instanceof File && photo.size > 0 ? photo : null,
  };
}

function photoBody(photo: File): FormData {
  const body = new FormData();
  body.append("file", photo);
  return body;
}

/** Admin: registers an agent, then saves the director's ID photo if one was chosen. */
export async function createAgentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agent:write");

  const parsed = readAgent(formData);
  if (!parsed.ok) return parsed.state;

  let agentId: number;
  try {
    agentId = (await createAgent({ ...parsed.fields, vatRegistered: false })).id;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/agents");

  // The agent exists by now, so sending the form again would register them twice: a photo that
  // fails to save is retried from the edit page instead.
  if (parsed.photo) {
    try {
      await uploadDirectorId(agentId, photoBody(parsed.photo));
    } catch {
      redirect(`/admin/agents/${agentId}/edit?photo=failed`);
    }
  }

  await flashToast("success", "Agent registered.");
  redirect(`/admin/agents/${agentId}`);
}

/** Admin: edits an agent. Details this form does not show are sent back as they were. */
export async function updateAgentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agent:write");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown agent." };

  const parsed = readAgent(formData);
  if (!parsed.ok) return parsed.state;

  try {
    // The backend replaces every field on save, so anything not sent is wiped.
    const current = await getAgent(id);
    await updateAgent(id, {
      ...parsed.fields,
      contactPerson: current.contactPerson,
      bankName: current.bankName,
      bankAccountNumber: current.bankAccountNumber,
      kraPin: current.kraPin,
      contractStartDate: current.contractStartDate,
      contractEndDate: current.contractEndDate,
      vatRegistered: current.vatRegistered,
    });
    if (parsed.photo) await uploadDirectorId(id, photoBody(parsed.photo));
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/agents", "layout");
  await flashToast("success", "Agent saved.");
  redirect(`/admin/agents/${id}`);
}

/** Admin: mark an agent inactive. The backend also disables their login. */
export async function deactivateAgentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agent:write");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown agent." };

  try {
    await deactivateAgent(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/agents", "layout");
  return { status: "success", data: undefined };
}
