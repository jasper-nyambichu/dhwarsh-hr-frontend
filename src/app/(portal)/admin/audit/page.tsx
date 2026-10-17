import { requireRole } from "@/app/lib/dal";
import { AuditLogView } from "@/components/features/audit/audit-log-view";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  return <AuditLogView searchParams={searchParams} basePath="/admin/audit" detailBasePath="/admin/audit" />;
}