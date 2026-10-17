import { requirePermission } from "@/app/lib/dal";
import { AuditLogView } from "@/components/features/audit/audit-log-view";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("audit:read");
  return <AuditLogView searchParams={searchParams} basePath="/audit/logs" detailBasePath="/audit/logs" />;
}