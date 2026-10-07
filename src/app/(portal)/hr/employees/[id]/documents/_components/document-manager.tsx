"use client";

import { useActionState, useState } from "react";

import {
  deleteDocumentAction,
  uploadDocumentAction,
} from "@/app/actions/document";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import { formatDate, humanizeEnum } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/types";
import type { ActionState, EmployeeDocumentResponse } from "@/types";

/**
 * Employee documents — upload, list, remove.
 *
 * All three are real endpoints, so this screen has no placeholder path. Three
 * things the old design assumed and the API does not have:
 *
 *  - **No expiry.** `EmployeeDocumentResponse` carries `uploadedAt` and nothing
 *    else date-like, so the "Expires in 12 days" chips are gone. They were the
 *    only reason the checklist looked urgent.
 *  - **No download.** `fileUrl` is a server-side storage path; there is no
 *    endpoint that serves the bytes. The view/download buttons are gone rather
 *    than being links that 404.
 *  - **No drag-and-drop.** A plain file input. Dropping a file on a div that
 *    cannot accept it is worse than a labelled input that can.
 */

const DOC_ICON: Record<string, string> = {
  CONTRACT: "description",
  NATIONAL_ID: "badge",
  KRA_PIN: "receipt_long",
  CERTIFICATE: "workspace_premium",
  CV: "article",
  OTHER: "attach_file",
};

export function DocumentManager({
  employeeId,
  documents,
}: {
  employeeId: number;
  documents: EmployeeDocumentResponse[];
}) {
  const present = new Set(documents.map((document) => document.documentType));

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
        <UploadPanel employeeId={employeeId} />

        {documents.length === 0 ? (
          <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
            <Icon
              name="folder_open"
              className="mb-3 text-[40px] text-on-surface-variant"
            />
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              No documents on file
            </p>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Upload the first one using the panel above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 md:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                employeeId={employeeId}
                document={document}
              />
            ))}
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-4">
        <div className="rounded-card border border-surface-container bg-surface-container-lowest p-card-padding shadow-ambient-1">
          <h3 className="mb-1 font-body-lg text-body-lg font-bold text-on-surface">
            Required Documents
          </h3>
          <p className="mb-5 font-body-md text-[11px] text-outline">
            Which of the standard documents are on file. Nothing here expires —
            the API stores an upload date, not an expiry date.
          </p>

          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(present.size / DOCUMENT_TYPES.length) * 100}%` }}
            />
          </div>

          <ul className="flex flex-col gap-3">
            {DOCUMENT_TYPES.map((type) => {
              const onFile = present.has(type);

              return (
                <li key={type} className="flex items-center gap-3">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-[15px] ${
                      onFile
                        ? "bg-tertiary-container/20 text-tertiary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <Icon name={onFile ? "check" : "remove"} />
                  </span>
                  <span
                    className={`font-body-md text-body-md ${
                      onFile ? "font-medium text-on-surface" : "text-on-surface-variant"
                    }`}
                  >
                    {humanizeEnum(type)}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 border-t border-outline-variant/50 pt-4 text-[11px] text-outline">
            This is a checklist over the types standardised in the app. The
            backend stores the type as free text with no validation, so a
            document uploaded through the API directly could carry a type not
            listed here.
          </p>
        </div>
      </div>
    </div>
  );
}

function UploadPanel({ employeeId }: { employeeId: number }) {
  const [state, formAction] = useActionState<
    ActionState<EmployeeDocumentResponse>,
    FormData
  >(uploadDocumentAction, { status: "idle" });

  // The file input is uncontrolled and keeps its selection after a successful
  // submit, which would leave the panel looking like it still has a pending
  // upload. Keying the form on a counter clears both it and the action state.
  const [resetKey, setResetKey] = useState(0);

  useActionToast(state, {
    success: (document) => `Uploaded ${document.fileName ?? "document"}`,
    onSuccess: () => setResetKey((key) => key + 1),
  });

  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form
      key={resetKey}
      action={formAction}
      className="rounded-card border border-surface-container bg-surface-container-lowest p-card-padding shadow-ambient-1"
    >
      <input type="hidden" name="employeeId" value={employeeId} />

      <h3 className="mb-4 flex items-center gap-2 font-body-lg text-body-lg font-bold text-on-surface">
        <Icon name="cloud_upload" className="text-[22px] text-primary" />
        Upload a Document
      </h3>

      {state.status === "error" ? (
        <p role="alert" className="mb-4 text-[12px] text-error">
          {state.message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="document-type"
            className="mb-1 block font-table-header text-table-header uppercase text-outline"
          >
            Document Type
          </label>
          <select
            id="document-type"
            name="documentType"
            required
            defaultValue=""
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
          >
            <option value="" disabled>
              Choose a type
            </option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {humanizeEnum(type)}
              </option>
            ))}
          </select>
          {errors?.documentType?.[0] ? (
            <p className="mt-1 text-[11px] text-error">
              {errors.documentType[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="document-file"
            className="mb-1 block font-table-header text-table-header uppercase text-outline"
          >
            File
          </label>
          <input
            id="document-file"
            name="file"
            type="file"
            required
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface file:mr-3 file:rounded file:border-0 file:bg-surface-container file:px-3 file:py-1.5 file:font-body-md file:text-body-md file:text-on-surface-variant focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
          />
          {errors?.file?.[0] ? (
            <p className="mt-1 text-[11px] text-error">{errors.file[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-[11px] text-outline">
          Up to 10 MB. The file is stored by the backend under a path this app
          cannot serve back, so an upload cannot be previewed here afterwards.
        </p>
        <Button type="submit" icon="upload" className="shrink-0">
          Upload
        </Button>
      </div>
    </form>
  );
}

function DocumentCard({
  employeeId,
  document,
}: {
  employeeId: number;
  document: EmployeeDocumentResponse;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    deleteDocumentAction,
    { status: "idle" },
  );

  const [confirming, setConfirming] = useState(false);

  useActionToast(state, { success: "Document removed" });

  return (
    <div className="group relative flex flex-col rounded-card border border-surface-container bg-surface-container-lowest p-4 shadow-ambient-1">
      <span className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary-fixed text-primary">
        <Icon
          name={DOC_ICON[document.documentType] ?? "attach_file"}
          className="text-2xl"
        />
      </span>

      <h4 className="mb-1 truncate pr-8 font-body-md text-body-md font-bold text-on-surface">
        {document.fileName ?? "Untitled file"}
      </h4>
      <p className="mb-3 font-body-md text-[11px] text-on-surface-variant">
        {humanizeEnum(document.documentType)}
        {document.uploadedAt
          ? ` · uploaded ${formatDate(document.uploadedAt)}`
          : ""}
      </p>

      {/* The stored path, shown rather than linked — there is no endpoint that
          returns the bytes, so a link would go nowhere. */}
      <p className="mb-4 truncate font-mono text-[10px] text-outline" title={document.fileUrl}>
        {document.fileUrl ?? "No path recorded"}
      </p>

      {state.status === "error" ? (
        <p role="alert" className="mb-3 text-[11px] text-error">
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="mt-auto">
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="documentId" value={document.id} />

        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-error px-3 py-1.5 font-body-md text-[11px] font-semibold text-on-error"
            >
              Remove permanently
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="font-body-md text-[11px] font-semibold text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1 font-body-md text-[11px] font-semibold text-on-surface-variant transition-colors hover:text-error"
          >
            <Icon name="delete" className="text-[14px]" />
            Remove
          </button>
        )}
      </form>
    </div>
  );
}
