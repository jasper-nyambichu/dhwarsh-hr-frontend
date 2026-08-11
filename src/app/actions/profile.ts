"use server";

import { z } from "zod";

import { requirePermission } from "@/app/lib/dal";
import type { ActionState } from "@/types";

/**
 * Self-service profile actions.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOT YET WIRED TO THE BACKEND. `PUT /employees/{id}` exists, but the
 * self-service variant ("update the employee attached to *my* session,
 * limited to the fields an employee may change about themselves") does not —
 * exposing the general endpoint here would let an employee patch fields the
 * HR screens own.
 *
 * The action still validates and still reports honestly: the user gets the
 * same field-level errors they will get once it is live, and a clear
 * "not connected yet" instead of a silent no-op. Replace the marked block
 * with the real call when the endpoint lands.
 * ─────────────────────────────────────────────────────────────────────────
 */

const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required." })
    .max(100, { message: "First name is too long." })
    .trim(),
  lastName: z
    .string()
    .min(1, { message: "Last name is required." })
    .max(100, { message: "Last name is too long." })
    .trim(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Use the date picker." })
    .optional()
    .or(z.literal("")),
  gender: z.string().max(20).optional().or(z.literal("")),
  maritalStatus: z.string().max(20).optional().or(z.literal("")),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email address." })
    .trim(),
  phone: z
    .string()
    .min(1, { message: "Phone is required." })
    .max(30, { message: "Phone number is too long." })
    .trim(),
  address: z.string().max(255, { message: "Address is too long." }).optional().or(z.literal("")),
});

export async function updateMyProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Re-checked here because a Server Action is reachable as a direct POST
  // regardless of which component imported it.
  await requirePermission("employee:read:self");

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth") ?? "",
    gender: formData.get("gender") ?? "",
    maritalStatus: formData.get("maritalStatus") ?? "",
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  /* ---- replace with the real call once the endpoint exists --------------
   * try {
   *   await api.put("/employees/me", parsed.data);
   * } catch (error) {
   *   return toActionError(error);
   * }
   * revalidatePath("/me/profile");
   * return { status: "success", data: undefined };
   * --------------------------------------------------------------------- */
  return {
    status: "error",
    message: "Saving your profile isn't connected yet — your changes were not stored.",
  };
}
