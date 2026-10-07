"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DOCUMENT_TYPES } from "@/types";
import type { ActionState, EmployeeDocumentResponse } from "@/types";
import {
  deleteEmployeeDocument,
  uploadEmployeeDocument,
} from "@/lib/api/document";

/**
 * Employee document writes — `EmployeeDocumentController`.
 *
 * The upload is multipart. A Server Action receives the browser's `File` on the
 * FormData directly, so there is no base64 round-trip: the File goes into a new
 * FormData and out through `api.post`, which leaves Content-Type unset so the
 * runtime can supply the multipart boundary.
 */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function uploadDocumentAction(
  _prev: ActionState<EmployeeDocumentResponse>,
  formData: FormData,
): Promise<ActionState<EmployeeDocumentResponse>> {
  await requirePermission("employee:document:write");

  const employeeId = Number(formData.get("employeeId"));
  const documentType = String(formData.get("documentType") ?? "");
  const file = formData.get("file");

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return { status: "error", message: "That employee id is not valid." };
  }

  if (!DOCUMENT_TYPES.includes(documentType as (typeof DOCUMENT_TYPES)[number])) {
    return {
      status: "error",
      message: "Choose a document type.",
      fieldErrors: { documentType: ["Choose a document type."] },
    };
  }

  // A form submitted with no file chosen sends an empty File (size 0, name ""),
  // not null — so size, not presence, is what distinguishes the cases.
  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Choose a file to upload.",
      fieldErrors: { file: ["Choose a file to upload."] },
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      status: "error",
      message: "That file is larger than 10 MB.",
      fieldErrors: { file: ["Files must be 10 MB or smaller."] },
    };
  }

  try {
    const document = await uploadEmployeeDocument(
      employeeId,
      documentType,
      file,
    );

    revalidatePath(`/hr/employees/${employeeId}/documents`);

    return { status: "success", data: document };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Removes a document. There is no undo — the row and the stored file are both
 * gone, so the UI confirms before calling this.
 */
export async function deleteDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("employee:document:write");

  const employeeId = Number(formData.get("employeeId"));
  const documentId = Number(formData.get("documentId"));

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return { status: "error", message: "That employee id is not valid." };
  }

  if (!Number.isInteger(documentId) || documentId <= 0) {
    return { status: "error", message: "That document id is not valid." };
  }

  try {
    await deleteEmployeeDocument(employeeId, documentId);

    revalidatePath(`/hr/employees/${employeeId}/documents`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
