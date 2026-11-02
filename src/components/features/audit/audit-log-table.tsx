import Link from "next/link";

import { actionLabel, actionTone, formatTimestamp, parseDetails, TONE_CHIP } from "@/lib/audit-format";
import type { AuditLogResponse } from "@/types/audit";

/**
 * Read-only table of audit events. `detailBasePath` is where each row's detail page lives
 * (`/audit/logs` for the Auditor, `/admin/audit` for the Super Admin).
 */
export function AuditLogTable({
  logs,
  detailBasePath,
}: {
  logs: AuditLogResponse[];
  detailBasePath: string;
}) {
  return (
    <>
    <ul className="flex flex-col gap-3 md:hidden">
      {logs.map((log) => {
        const details = parseDetails(log.detailsJson);
        const who = log.performedByUsername ?? details.identifier ?? (log.performedByUserId ? `User #${log.performedByUserId}` : "System");

        return (
          <li key={log.id} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CHIP[actionTone(log.action)]}`}>
                {actionLabel(log.action)}
              </span>
              <Link href={`${detailBasePath}/${log.id}`} className="text-xs text-primary hover:underline">
                {formatTimestamp(log.createdAt)}
              </Link>
            </div>
            <p className="mt-2 break-words text-sm font-medium text-on-surface">{who}</p>
            <p className="break-words text-xs text-on-surface-variant">
              {log.entityType}
              {log.entityId ? ` #${log.entityId}` : ""}
              {details.ip ? ` · ${details.ip}` : ""}
            </p>
          </li>
        );
      })}
    </ul>
    <div className="hidden w-full overflow-x-auto md:block">
      <table className="data-table w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr>
            <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">When</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Who</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Action</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Record</th>
            <th className="pb-3 pr-2 font-table-header text-table-header uppercase text-outline">From</th>
          </tr>
        </thead>
        <tbody className="font-body-md text-body-md text-on-surface">
          {logs.map((log) => {
            const details = parseDetails(log.detailsJson);
            const who = log.performedByUsername ?? details.identifier ?? (log.performedByUserId ? `User #${log.performedByUserId}` : "System");

            return (
              <tr key={log.id} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                <td className="whitespace-nowrap py-3 pl-2 text-on-surface-variant">
                  <Link href={`${detailBasePath}/${log.id}`} className="text-primary hover:underline">
                    {formatTimestamp(log.createdAt)}
                  </Link>
                </td>
                <td className="py-3 font-medium">{who}</td>
                <td className="py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CHIP[actionTone(log.action)]}`}>
                    {actionLabel(log.action)}
                  </span>
                </td>
                <td className="py-3 text-on-surface-variant">
                  {log.entityType}
                  {log.entityId ? <span className="text-outline"> #{log.entityId}</span> : null}
                </td>
                <td className="py-3 pr-2 font-mono text-[11px] text-on-surface-variant">{details.ip ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}