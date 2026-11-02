"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import {
  removeCompanyLogo,
  saveCompany,
  uploadCompanyLogo,
  updateCompanySettings,
  type CompanyInput,
} from "@/lib/api/company";
import type { ActionState } from "@/types";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function text(formData: FormData, name: string): string | undefined {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? undefined : value;
}

/** Admin: create or update the company profile. */
export async function saveCompanyAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const name = text(formData, "name");
  const email = text(formData, "email");
  const fieldErrors: Record<string, string[]> = {};

  if (!name) fieldErrors.name = ["Required"];
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ["Not a valid email"];

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  // The backend replaces every field on save, so anything not sent is wiped. The logo is the
  // exception: it only changes through its own upload.
  const payload: CompanyInput = {
    name: name!,
    address: text(formData, "address"),
    phone: text(formData, "phone"),
    email,
    website: text(formData, "website"),
    kraPin: text(formData, "kraPin"),
    shifNumber: text(formData, "shifNumber"),
    nssfNumber: text(formData, "nssfNumber"),
    nitaNumber: text(formData, "nitaNumber"),
    currency: text(formData, "currency") ?? "KES",
    timezone: text(formData, "timezone") ?? "Africa/Nairobi",
  };

  try {
    await saveCompany(payload);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/companies");
  return { status: "success", data: undefined };
}

/** Admin: the logo on payslips and employee lists. The backend checks the file really is an image. */
export async function uploadCompanyLogoAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a logo file." };
  }

  const body = new FormData();
  body.append("file", file);

  try {
    await uploadCompanyLogo(body);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/settings");
  return { status: "success", data: undefined };
}

export async function removeCompanyLogoAction(
  _previous: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    await removeCompanyLogo();
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/settings");
  return { status: "success", data: undefined };
}

/** Admin: company rules — VAT, working hours, overtime, weekend. */
export async function saveSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const vatRate = Number(formData.get("vatRate"));
  const hours = Number(formData.get("defaultWorkingHoursPerDay"));
  const overtime = Number(formData.get("overtimeMultiplier"));
  const weekend = formData
    .getAll("weekendDays")
    .map((value) => String(value))
    .filter((value) => DAYS.includes(value));

  const fieldErrors: Record<string, string[]> = {};
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) fieldErrors.vatRate = ["0 – 100"];
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) fieldErrors.defaultWorkingHoursPerDay = ["1 – 24"];
  if (!Number.isFinite(overtime) || overtime < 1 || overtime > 5) fieldErrors.overtimeMultiplier = ["1 – 5"];
  if (weekend.length < 1 || weekend.length > 2) fieldErrors.weekendDays = ["Choose one or two days"];

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  try {
    await updateCompanySettings({
      vatRate,
      defaultWorkingHoursPerDay: hours,
      overtimeMultiplier: overtime,
      weekendDays: weekend.join(","),
      payrollPeriod: "MONTHLY",
    });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/settings");
  return { status: "success", data: undefined };
}