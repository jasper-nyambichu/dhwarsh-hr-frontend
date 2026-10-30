import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { AuditLogDetail } from "@/components/features/audit/audit-log-detail";

export default async function FinanceAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("audit:read");

  const { id } = await params;
  const logId = Number(id);
  if (!Number.isInteger(logId) || logId <= 0) notFound();

  return <AuditLogDetail id={logId} backHref="/finance/audit" detailBasePath="/finance/audit" />;
}