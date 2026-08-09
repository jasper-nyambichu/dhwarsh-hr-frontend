//src/app/(portal)/employee/documents/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * Personal documents hub (upload + grid of stored documents).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.EmployeeDocument`. The
 * dropzone here is presentational only; wire it to a client component with
 * an upload handler once the storage API exists.
 * ─────────────────────────────────────────────────────────────────────────
 */

type DocumentBadge =
  | { kind: "EXPIRING"; label: string }
  | { kind: "VERIFIED"; label: "Verified" }
  | { kind: "NEUTRAL"; label: string };

type DocumentCard = {
  id: number;
  fileName: string;
  displayName: string;
  uploadedDate: string;
  sizeLabel: string;
  icon: string;
  iconBgClassName: string;
  iconColorClassName: string;
  badge: DocumentBadge;
};

const DOCUMENTS: readonly DocumentCard[] = [
  {
    id: 1,
    fileName: "National_Passport_Scan.pdf",
    displayName: "National_Passport_Scan.pdf",
    uploadedDate: "12 Oct 2023",
    sizeLabel: "2.4 MB",
    icon: "picture_as_pdf",
    iconBgClassName: "bg-error-container/30",
    iconColorClassName: "text-error",
    badge: { kind: "EXPIRING", label: "Expires in 30 days" },
  },
  {
    id: 2,
    fileName: "Signed_Employment_Contract_2023.pdf",
    displayName: "Signed_Employment_Contract...",
    uploadedDate: "01 Jan 2023",
    sizeLabel: "1.1 MB",
    icon: "description",
    iconBgClassName: "bg-secondary-fixed/50",
    iconColorClassName: "text-primary",
    badge: { kind: "VERIFIED", label: "Verified" },
  },
  {
    id: 3,
    fileName: "Driver_License_Front.jpg",
    displayName: "Driver_License_Front.jpg",
    uploadedDate: "15 Aug 2023",
    sizeLabel: "4.5 MB",
    icon: "image",
    iconBgClassName: "bg-surface-variant",
    iconColorClassName: "text-on-surface-variant",
    badge: { kind: "NEUTRAL", label: "ID Proof" },
  },
  {
    id: 4,
    fileName: "Tax_Declaration_2023.pdf",
    displayName: "Tax_Declaration_2023.pdf",
    uploadedDate: "05 Apr 2023",
    sizeLabel: "850 KB",
    icon: "request_quote",
    iconBgClassName: "bg-secondary-fixed/50",
    iconColorClassName: "text-primary",
    badge: { kind: "NEUTRAL", label: "Financial" },
  },
];

function DocumentBadgePill({ badge }: { badge: DocumentBadge }) {
  if (badge.kind === "EXPIRING") {
    return (
      <span className="flex items-center gap-1 rounded-md bg-error-container px-2 py-1 text-xs font-medium text-on-error-container">
        <Icon name="warning" className="text-[14px]" />
        {badge.label}
      </span>
    );
  }
  if (badge.kind === "VERIFIED") {
    return (
      <span className="flex items-center gap-1 rounded-md bg-tertiary-fixed-dim/30 px-2 py-1 text-xs font-medium text-tertiary">
        <Icon name="check_circle" className="text-[14px]" />
        {badge.label}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-md bg-surface-container px-2 py-1 text-xs font-medium text-on-surface-variant">
      {badge.label}
    </span>
  );
}

export default async function EmployeeDocumentsPage() {
  await requirePermission("employee:read:self");

  return (
    <>
      <PageHeader
        title="My Documents"
        actions={
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-secondary-fixed/50 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary-fixed">
              <Icon name="filter_list" className="text-[18px]" />
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary/90">
              <Icon name="add" className="text-[18px]" />
              New Document
            </button>
          </div>
        }
      />

      {/* ─────────────────────────────── upload dropzone ────────────────── */}
      <button
        type="button"
        className="group flex w-full flex-col items-center justify-center rounded-card border border-dashed border-outline-variant/60 bg-gradient-to-b from-surface-bright to-surface-container-lowest p-8 text-center shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]"
      >
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary-fixed/50 transition-transform duration-300 group-hover:scale-110">
          <Icon name="cloud_upload" className="text-3xl text-primary" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-on-surface">Upload New Document</h3>
        <p className="mb-4 text-sm text-on-surface-variant">Drag and drop files here, or click to browse</p>
        <p className="text-xs font-medium uppercase tracking-wider text-outline">
          Supported formats: PDF, JPG, PNG (Max 10MB)
        </p>
      </button>

      {/* ─────────────────────────────── document grid ─────────────────── */}
      <div className="mt-stack-md grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex flex-col rounded-card border border-transparent bg-surface-container-lowest p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all duration-300 hover:-translate-y-[2px] hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={`flex size-10 items-center justify-center rounded-lg ${doc.iconBgClassName}`}>
                <Icon name={doc.icon} className={doc.iconColorClassName} />
              </div>
              <button className="text-on-surface-variant opacity-0 transition-colors group-hover:opacity-100 hover:text-primary">
                <Icon name="more_vert" />
              </button>
            </div>

            <h4 className="mb-1 truncate text-base font-semibold text-on-surface" title={doc.fileName}>
              {doc.displayName}
            </h4>
            <p className="mb-4 text-xs text-on-surface-variant">Uploaded: {doc.uploadedDate}</p>

            <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-4">
              <DocumentBadgePill badge={doc.badge} />
              <span className="text-xs text-outline">{doc.sizeLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}