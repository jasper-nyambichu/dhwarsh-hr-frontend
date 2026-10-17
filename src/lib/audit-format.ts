import { format, parseISO } from "date-fns";

import { humanizeEnum } from "@/lib/format";

/** "17 Oct 2026, 09:30:12". The backend sends wall-clock time with no zone, shown as-is. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "d MMM yyyy, HH:mm:ss");
  } catch {
    return value;
  }
}

export function actionLabel(action: string): string {
  return humanizeEnum(action);
}

export type ActionTone = "danger" | "warn" | "good" | "info" | "neutral";

/** Colours an action by what an auditor should notice about it. */
export function actionTone(action: string): ActionTone {
  if (action === "LOGIN_FAILED" || action === "LOGIN_BLOCKED") return "danger";
  if (action === "LOGIN_SUCCESS") return "good";
  if (/(DELETED|TERMINATED|DEACTIVATED|REJECTED)$/.test(action)) return "warn";
  if (action.startsWith("PAYROLL") || action.startsWith("LOAN") || action.startsWith("AGENT_ADVANCE")) return "info";
  return "neutral";
}

export const TONE_CHIP: Record<ActionTone, string> = {
  danger: "bg-error/10 text-error border border-error/30",
  warn: "bg-amber-main/10 text-amber-main border border-amber-main/30",
  good: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30",
  info: "bg-primary/10 text-primary border border-primary/20",
  neutral: "bg-surface-variant text-on-surface-variant border border-outline-variant/50",
};

/** The details text as a flat key / value map; anything unparsable gives an empty map. */
export function parseDetails(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
    );
  } catch {
    return {};
  }
}