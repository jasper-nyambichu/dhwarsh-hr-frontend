import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";
import type { DocumentType, EmployeeDocument } from "@/types";

/**
 * Employee documents.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.EmployeeDocument`. Swap for
 * `await api.get<EmployeeDocument[]>(`/employees/${id}/documents`)`.
 * Expiry dates aren't on the DTO yet — the backend will need to add one for
 * the "expires in N days" chips to be real rather than illustrative.
 * ─────────────────────────────────────────────────────────────────────────
 */

const DOC_ICON: Record<DocumentType, string> = {
  CONTRACT: "description",
  NATIONAL_ID: "badge",
  KRA_PIN: "picture_as_pdf",
  CERTIFICATE: "workspace_premium",
  CV: "description",
  OTHER: "credit_card",
};

const DOCUMENTS: readonly (EmployeeDocument & { statusLabel: string; statusTone: string })[] = [
  { id: 1, employeeId: 1, documentType: "CONTRACT", fileUrl: "#", fileName: "Employment Contract", createdAt: "2023-01-12", updatedAt: null, createdBy: null, updatedBy: null, statusLabel: "Valid", statusTone: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  { id: 2, employeeId: 1, documentType: "NATIONAL_ID", fileUrl: "#", fileName: "National ID", createdAt: "2023-01-10", updatedAt: null, createdBy: null, updatedBy: null, statusLabel: "Expires in 12 days", statusTone: "bg-amber-main/20 text-amber-main" },
  { id: 3, employeeId: 1, documentType: "KRA_PIN", fileUrl: "#", fileName: "KRA PIN Certificate", createdAt: "2023-01-10", updatedAt: null, createdBy: null, updatedBy: null, statusLabel: "Valid", statusTone: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  { id: 4, employeeId: 1, documentType: "CERTIFICATE", fileUrl: "#", fileName: "Compliance Cert.", createdAt: "2022-06-05", updatedAt: null, createdBy: null, updatedBy: null, statusLabel: "Expired", statusTone: "bg-error text-on-error" },
  { id: 5, employeeId: 1, documentType: "CV", fileUrl: "#", fileName: "Curriculum Vitae", createdAt: "2023-01-08", updatedAt: null, createdBy: null, updatedBy: null, statusLabel: "No Expiry", statusTone: "bg-surface-container-high text-on-surface-variant" },
  { id: 6, employeeId: 1, documentType: "OTHER", fileUrl: "#", fileName: "NSSF Card", createdAt: "2023-01-10", updatedAt: null, createdBy: null, updatedBy: null, statusLabel: "Valid", statusTone: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
];

const CHECKLIST = [
  { label: "National ID", present: true },
  { label: "KRA PIN", present: true },
  { label: "Employment Contract", present: true },
  { label: "Academic Certificates", present: true },
  { label: "NSSF Card", present: true },
  { label: "SHIF Card", present: false },
  { label: "Passport Photo", present: false },
] as const;

export default async function EmployeeDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:read");
  const { id } = await params;

  const presentCount = CHECKLIST.filter((c) => c.present).length;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/hr/employees/${id}`}
            className="flex size-10 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-variant shadow-sm transition-shadow hover:shadow-md hover:text-primary"
          >
            <Icon name="arrow_back_ios_new" />
          </Link>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-on-primary-fixed-variant px-6 py-2.5 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <Icon name="upload" className="text-sm" />
            Upload Document
          </button>
        </div>
      </div>

      <PageHeader
        title="Amina Yusuf — Documents"
        description="Manage and verify employee compliance documents."
      />

      <div className="grid grid-cols-12 items-start gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary-container bg-surface-bright py-10 transition-colors hover:bg-primary-container/5"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
              <Icon name="cloud_upload" className="text-3xl" />
            </span>
            <h3 className="font-page-title text-page-title text-primary-container">
              Drag and drop or browse files to upload
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Supported formats: PDF, JPEG, PNG, DOCX (Max 10MB)
            </p>
          </button>

          <div className="flex items-center justify-between">
            <h3 className="font-page-title text-lg text-on-surface">Employee Files</h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-surface-container-lowest p-2 text-on-surface-variant shadow-sm hover:text-primary"
              >
                <Icon name="filter_list" className="text-sm" />
              </button>
              <button
                type="button"
                className="rounded-lg bg-surface-container-lowest p-2 text-on-surface-variant shadow-sm hover:text-primary"
              >
                <Icon name="grid_view" className="text-sm" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 md:grid-cols-3">
            {DOCUMENTS.map((doc) => (
              <BentoCard key={doc.id} className="group relative flex flex-col p-4">
                <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex size-8 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-primary-container/20">
                    <Icon name="visibility" className="text-[16px]" />
                  </button>
                  <button className="flex size-8 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-primary-container/20">
                    <Icon name="download" className="text-[16px]" />
                  </button>
                </div>
                <span className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                  <Icon name={DOC_ICON[doc.documentType]} className="text-2xl" />
                </span>
                <h4 className="mb-1 truncate pr-8 text-sm font-bold text-on-surface">{doc.fileName}</h4>
                <p className="mb-4 text-xs text-on-surface-variant">Uploaded: {formatDate(doc.createdAt)}</p>
                <span
                  className={`mt-auto inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${doc.statusTone}`}
                >
                  {doc.statusLabel}
                </span>
              </BentoCard>
            ))}
          </div>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard
            title="Document Checklist"
            action={
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-container/10 text-sm font-bold text-primary">
                {presentCount}/{CHECKLIST.length}
              </span>
            }
          >
            <div className="mb-6 h-2 w-full rounded-full bg-surface-container-high">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(presentCount / CHECKLIST.length) * 100}%` }}
              />
            </div>
            <ul className="flex flex-col gap-4">
              {CHECKLIST.map((item) => (
                <li key={item.label} className="group flex items-center gap-3">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-[16px] ${
                      item.present
                        ? "bg-tertiary-fixed text-tertiary-container"
                        : "cursor-pointer bg-error-container text-error"
                    }`}
                  >
                    <Icon name={item.present ? "check" : "remove"} />
                  </span>
                  <span
                    className={`font-body-md text-sm ${
                      item.present
                        ? "font-medium text-on-surface"
                        : "text-on-surface-variant transition-colors group-hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </span>
                  {!item.present && (
                    <Icon
                      name="upload"
                      className="ml-auto text-[14px] text-primary opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-outline-variant pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-soft px-4 py-2 font-body-md text-body-md font-bold text-primary-container transition-colors hover:bg-primary-container hover:text-on-primary"
              >
                <Icon name="notifications_active" className="text-sm" />
                Send Reminder
              </button>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}