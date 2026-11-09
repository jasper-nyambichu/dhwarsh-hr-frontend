"use server";

import { refresh } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { verifySession } from "@/app/lib/dal";
import { changePasswordSchema, profileSchema } from "@/app/lib/definitions";
import { createSession } from "@/app/lib/session";
import { changeMyPassword, removeMyPhoto, updateMyProfile, uploadMyPhoto } from "@/lib/api/profile";
import type { ActionState } from "@/types";

const CHECK_FIELDS = "Check the fields below.";

/** Anyone signed in: their own name and email. The top bar reads the name from the session, so that is updated too. */
export async function saveProfileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") ?? "",
    currentPassword: formData.get("currentPassword") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, currentPassword } = parsed.data;
  const displayName = `${firstName} ${lastName}`.trim();

  try {
    await updateMyProfile({ displayName, email, currentPassword });
  } catch (error) {
    return toActionError(error);
  }

  await createSession({ ...session, displayName });
  refresh();
  return { status: "success", data: undefined };
}

/** Anyone signed in: their own password. The backend checks the current one. */
export async function changeMyPasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await verifySession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await changeMyPassword({ currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword });
  } catch (error) {
    return toActionError(error);
  }
  return { status: "success", data: undefined };
}

/** A new version number makes every <img> on the page fetch the new photo instead of its cached one. */
export async function uploadMyPhotoAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a photo to upload." };
  }

  const body = new FormData();
  body.append("file", file);

  try {
    await uploadMyPhoto(body);
  } catch (error) {
    return toActionError(error);
  }

  await createSession({ ...session, photoVersion: Date.now() });
  refresh();
  return { status: "success", data: undefined };
}

export async function removeMyPhotoAction(): Promise<ActionState> {
  const session = await verifySession();

  try {
    await removeMyPhoto();
  } catch (error) {
    return toActionError(error);
  }

  await createSession({ ...session, photoVersion: null });
  refresh();
  return { status: "success", data: undefined };
}
