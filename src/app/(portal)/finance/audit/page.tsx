import { requirePermission } from "@/app/lib/dal";
import { AuditLogView } from "@/components/features/audit/audit-log-view";

/** The Accounts Office's history log — the same read-only log, inside its own menu. */
export default async function FinanceAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("audit:read");
  return <AuditLogView searchParams={searchParams} basePath="/finance/audit" detailBasePath="/finance/audit" />;
}