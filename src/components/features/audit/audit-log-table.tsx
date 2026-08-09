// src/components/features/audit/audit-log-table.tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Shaped as a page-local type until an `AuditLogEntry` shape exists on
 * `@/types`. Swap for the real DTO when the audit-log API is wired up.
 * ─────────────────────────────────────────────────────────────────────────
 */
export type AuditLogAction = "CREATE" | "UPDATE" | "DELETE" | "EXECUTE";

export type AuditLogDetail =
  | {
      kind: "diff";
      lines: { type: "context" | "added" | "removed"; text: string }[];
      transactionId: string;
      sessionId: string;
    }
  | { kind: "note"; message: string }
  | { kind: "error"; title: string; message: string };

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actor: string;
  role: string;
  module: string;
  action: AuditLogAction;
  entity: string;
  ipAddress: string;
  result: "success" | "error";
  detail: AuditLogDetail;
}

function actionColor(action: AuditLogAction) {
  switch (action) {
    case "UPDATE":
      return "text-tertiary";
    case "EXECUTE":
      return "text-primary-container";
    case "DELETE":
      return "text-error";
    default:
      return "text-on-surface";
  }
}

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(logs[0]?.id ?? null);

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-ambient-1">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low/50">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Timestamp
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Actor
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Role
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Module
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Action
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Entity
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                IP Address
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {logs.map((log) => {
              const isOpen = expandedId === log.id;
              return (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(isOpen ? null : log.id)}
                    className={`cursor-pointer border-b border-outline-variant transition-colors hover:bg-surface ${
                      log.result === "error" ? "bg-error-container/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <Icon
                        name="keyboard_arrow_down"
                        className={`text-on-surface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface">{log.timestamp}</td>
                    <td className="px-4 py-3 font-medium text-primary">{log.actor}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-semibold text-on-surface-variant">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.module}</td>
                    <td className={`px-4 py-3 font-medium ${actionColor(log.action)}`}>{log.action}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-on-surface-variant">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-center">
                      <Icon
                        name={log.result === "success" ? "check_circle" : "error"}
                        className={log.result === "success" ? "text-tertiary" : "text-error"}
                      />
                    </td>
                  </tr>

                  {isOpen && (
                    <tr key={`${log.id}-detail`} className="border-b border-outline-variant/50 bg-surface-container-low/30">
                      <td className="p-0" colSpan={9}>
                        <div className="px-8 py-4">
                          {log.detail.kind === "diff" && (
                            <>
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                                  Mutation Payload (JSON Diff)
                                </h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigator.clipboard.writeText(log.detail.kind === "diff" ? JSON.stringify(log.detail.lines) : "")
                                  }
                                  className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                                >
                                  <Icon name="content_copy" className="text-[14px]" />
                                  Copy Raw
                                </button>
                              </div>
                              <div className="overflow-x-auto rounded-lg bg-inverse-surface p-4 font-mono text-[11px] leading-relaxed text-inverse-on-surface shadow-inner">
                                {log.detail.lines.map((line, i) => (
                                  <div
                                    key={i}
                                    className={
                                      line.type === "added"
                                        ? "bg-tertiary-container/20 text-tertiary"
                                        : line.type === "removed"
                                          ? "bg-error-container/20 text-error line-through opacity-70"
                                          : "text-inverse-on-surface"
                                    }
                                  >
                                    {line.text}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 flex gap-4 text-[10px] text-on-surface-variant">
                                <div>
                                  <span className="font-medium">Transaction ID:</span> {log.detail.transactionId}
                                </div>
                                <div>
                                  <span className="font-medium">Session ID:</span> {log.detail.sessionId}
                                </div>
                              </div>
                            </>
                          )}

                          {log.detail.kind === "note" && (
                            <p className="py-4 text-sm italic text-on-surface-variant">{log.detail.message}</p>
                          )}

                          {log.detail.kind === "error" && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-error-container bg-error-container/30 p-4 text-on-surface">
                              <Icon name="warning" className="mt-0.5 text-error" />
                              <div>
                                <h5 className="mb-1 font-medium text-error">{log.detail.title}</h5>
                                <p className="text-xs text-on-surface-variant">{log.detail.message}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
        <span className="text-xs text-on-surface-variant">Showing 1-25 of 1,492 entries</span>
        <div className="flex gap-1">
          <button className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50" disabled>
            <Icon name="chevron_left" />
          </button>
          <button className="rounded bg-primary-container px-3 py-1 text-xs font-medium text-on-primary">1</button>
          <button className="rounded px-3 py-1 text-xs font-medium text-on-surface hover:bg-surface-container-high">2</button>
          <button className="rounded px-3 py-1 text-xs font-medium text-on-surface hover:bg-surface-container-high">3</button>
          <span className="px-2 py-1 text-xs text-on-surface-variant">...</span>
          <button className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high">
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>
    </div>
  );
}