import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { AuditLogTable } from "@/components/features/audit/audit-log-table";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAuditLog, getAuditLogsForEntity } from "@/lib/api/audit";
import { actionLabel, actionTone, formatTimestamp, parseDetails, TONE_CHIP } from "@/lib/audit-format";
import type { AuditLogResponse } from "@/types/audit";

const DETAIL_LABELS: Record<string, string> = {
  method: "HTTP method",
  path: "Request path",
  ip: "From address",
  surface: "Sign-in surface",
  identifier: "Identifier used",
  reason: "Reason",
};

/** One audit event, plus everything else that happened to the same record. */
export async function AuditLogDetail({
  id,
  backHref,
  detailBasePath,
}: {
  id: number;
  backHref: string;
  detailBasePath: string;
}) {
  let log: AuditLogResponse;
  try {
    log = await getAuditLog(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return (
      <DataUnavailable
        title="Audit Event"
        subject="This audit event"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const related = log.entityId
    ? await getAuditLogsForEntity(log.entityType, log.entityId, 15).catch(() => null)
    : null;
  const others = related?.content.filter((entry) => entry.id !== log.id) ?? [];
  const details = Object.entries(parseDetails(log.detailsJson));

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link href={backHref} aria-label="Back to the audit log" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high">
              <Icon name="arrow_back" />
            </Link>
            {`Event #${log.id}`}
          </span>
        }
        description={formatTimestamp(log.createdAt)}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-gutter">
        <BentoCard title="What happened">
          <div className="flex flex-col">
            {[
              ["Action", null],
              ["Performed by", log.performedByUsername ?? (log.performedByUserId ? `User #${log.performedByUserId}` : "System / not signed in")],
              ["Record", `${log.entityType}${log.entityId ? ` #${log.entityId}` : ""}`],
              ["When", formatTimestamp(log.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-3 last:border-0">
                <span className="text-xs text-on-surface-variant">{label}</span>
                {value === null ? (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CHIP[actionTone(log.action)]}`}>{actionLabel(log.action)}</span>
                ) : (
                  <span className="text-right text-sm font-medium text-on-surface">{value}</span>
                )}
              </div>
            ))}
          </div>
        </BentoCard>

        {details.length > 0 ? (
          <BentoCard title="Request details" subtitle="Descriptive facts only — request bodies, passwords and PINs are never stored">
            <div className="flex flex-col">
              {details.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-3 last:border-0">
                  <span className="text-xs text-on-surface-variant">{DETAIL_LABELS[key] ?? key}</span>
                  <span className="break-all text-right font-mono text-xs text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </BentoCard>
        ) : null}

        {log.entityId ? (
          <BentoCard title={`Other events on ${log.entityType} #${log.entityId}`}>
            {others.length === 0 ? (
              <p className="py-2 text-sm text-on-surface-variant">No other events are recorded for this record.</p>
            ) : (
              <AuditLogTable logs={others} detailBasePath={detailBasePath} />
            )}
          </BentoCard>
        ) : null}

        <p className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Icon name="lock" className="text-[14px]" />
          Audit entries are append-only — they cannot be edited or deleted.
        </p>
      </div>
    </>
  );
}