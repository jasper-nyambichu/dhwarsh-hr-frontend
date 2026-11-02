import { Icon } from "@/components/ui/icon";

/**
 * Downloads the employee list. Who is signed in decides what it holds: the backend gives an Admin
 * the branch asked for or everyone, a Branch Manager their own branch, an Agent their own employees.
 */
export function EmployeeExportButtons({ branchId }: { branchId?: number }) {
  const scope = branchId ? `&branchId=${branchId}` : "";

  return (
    <>
      <a
        href={`/api/employees/export?format=PDF${scope}`}
        className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
      >
        <Icon name="picture_as_pdf" className="text-[18px]" />
        Export PDF
      </a>
      <a
        href={`/api/employees/export?format=CSV${scope}`}
        className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
      >
        <Icon name="table_view" className="text-[18px]" />
        Export Excel (CSV)
      </a>
    </>
  );
}
