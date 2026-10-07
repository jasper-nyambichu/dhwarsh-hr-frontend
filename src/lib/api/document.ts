import "server-only";

import { api } from "@/app/lib/api-client";
import type { EmployeeDocumentResponse } from "@/types";

/**
 * `controller/employee/EmployeeDocumentController` — base
 * `/employees/{employeeId}/documents`.
 *
 * The upload is `multipart/form-data`, not JSON: `documentType` travels as a
 * request *param* alongside the file part rather than in a JSON body, because
 * Spring cannot bind a JSON body and a MultipartFile on the same request.
 *
 * `api.post` detects a `FormData` body and deliberately leaves Content-Type
 * unset, so the runtime can add the multipart boundary — setting it by hand
 * would break the parse.
 *
 * `fileUrl` on the response is a server-side path, not a URL this app can
 * render in an <img> or link to; there is no download endpoint for documents.
 */

/** Documents attached to one employee. */
export function getEmployeeDocuments(
  employeeId: number,
  signal?: AbortSignal,
): Promise<EmployeeDocumentResponse[]> {
  return api.get<EmployeeDocumentResponse[]>(
    `/employees/${employeeId}/documents`,
    { signal },
  );
}

/**
 * Uploads one document. SUPER_ADMIN, ADMIN, HR_MANAGER.
 *
 * `documentType` is a free-form `String` on the backend — there is no
 * `DocumentType` enum and no validation, only a comment on the entity listing
 * CONTRACT, ID, CERTIFICATE, OTHER. So nothing here can 400 on the type, but a
 * value outside that set makes the column's own documentation wrong. `@/types`
 * `DOCUMENT_TYPES` is the vocabulary this app writes; it is a superset of the
 * entity's comment (it has NATIONAL_ID rather than ID, plus KRA_PIN and CV).
 */
export function uploadEmployeeDocument(
  employeeId: number,
  documentType: string,
  file: File,
): Promise<EmployeeDocumentResponse> {
  const body = new FormData();
  body.set("documentType", documentType);
  body.set("file", file);

  return api.post<EmployeeDocumentResponse>(
    `/employees/${employeeId}/documents`,
    body,
  );
}

/** Removes a document. SUPER_ADMIN, ADMIN, HR_MANAGER. */
export function deleteEmployeeDocument(
  employeeId: number,
  documentId: number,
): Promise<void> {
  return api.delete<void>(`/employees/${employeeId}/documents/${documentId}`);
}
