// src/components/features/branch/attendance-table.tsx
"use client";

import { useState } from "react";

import { toast } from "@/lib/toast";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Pending";

export interface AttendanceRow {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
  role: string;
  shift: string;
  status: AttendanceStatus;
}

const STATUS_STYLES: Record<AttendanceStatus, { bg: string; text: string; dot: string }> = {
  Present: { bg: "bg-[#e6f4ea]", text: "text-[#137333]", dot: "bg-[#137333]" },
  Absent: { bg: "bg-[#fce8e6]", text: "text-[#c5221f]", dot: "bg-[#c5221f]" },
  Late: { bg: "bg-[#fef7e0]", text: "text-[#f29900]", dot: "bg-[#f29900]" },
  Pending: { bg: "bg-surface-container", text: "text-on-surface-variant", dot: "bg-outline" },
};

export function AttendanceTable({ rows: initialRows }: { rows: AttendanceRow[] }) {
  const [rows, setRows] = useState(initialRows);

  function setStatus(id: string, status: AttendanceStatus) {
    const row = rows.find((r) => r.id === id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (row && row.status !== status) {
      toast.success(`${row.name} marked ${status}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-ambient-1">
      <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
        <h3 className="font-semibold text-on-surface">Today&apos;s Roster</h3>
        <div className="flex gap-2">
          <button
            type="button"
            data-live=""
            onClick={() => toast.notImplemented("All-shifts filter")}
            className="rounded-md bg-primary-container/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-container/20"
          >
            All
          </button>
          <button
            type="button"
            data-live=""
            onClick={() => toast.notImplemented("Shift filter")}
            className="rounded-md px-3 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Morning Shift
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-lowest">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Employee</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Role / Shift</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase text-on-surface-variant">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-on-surface">
            {rows.map((row) => {
              const style = STATUS_STYLES[row.status];
              return (
                <tr key={row.id} className="border-b border-outline-variant/10 transition-colors hover:bg-surface-container-lowest">
                  <td className="flex items-center gap-3 px-4 py-3">
                    {row.avatarUrl ? (
                      <img src={row.avatarUrl} alt={row.name} className="size-8 rounded-full" />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-secondary">
                        {row.initials}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{row.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                      <span className={`size-1.5 rounded-full ${style.dot}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex rounded-lg border border-outline-variant/20 bg-surface-container p-0.5">
                      {(["Present", "Absent", "Late"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          data-live=""
                          onClick={() => setStatus(row.id, s)}
                          aria-pressed={row.status === s}
                          aria-label={`Mark ${row.name} ${s}`}
                          className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                            row.status === s ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:bg-white/50"
                          }`}
                        >
                          {s[0]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center border-t border-outline-variant/10 bg-surface-container-lowest p-3">
        <button className="text-xs font-semibold text-primary hover:underline">View All 42 Employees</button>
      </div>
    </div>
  );
}