import { notFound } from "next/navigation";

import { requireRole } from "@/app/lib/dal";
import { AuditLogDetail } from "@/components/features/audit/audit-log-detail";

export default async function AdminAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["SUPER_ADMIN"]);

  const { id } = await params;
  const logId = Number(id);
  if (!Number.isInteger(logId) || logId <= 0) notFound();

  return <AuditLogDetail id={logId} backHref="/admin/audit" detailBasePath="/admin/audit" />;
}