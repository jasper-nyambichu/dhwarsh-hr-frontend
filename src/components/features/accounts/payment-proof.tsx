import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import type { PaymentMethod, PaymentRequestItem } from "@/types/money-flow";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  MPESA: "M-Pesa",
  CHEQUE: "Cheque",
  MANUAL: "Manual",
};

const METHOD_ICON: Record<PaymentMethod, string> = {
  MPESA: "smartphone",
  CHEQUE: "money",
  MANUAL: "edit_note",
};

/** Where the proof of a payment opens (the route checks who may see it). */
export function evidenceHref(paymentRequestId: number): string {
  return `/api/payment-evidence/${paymentRequestId}`;
}

/** One line saying how a payment was made, for tables: "M-Pesa · QGH7K2L9XP". */
export function paymentSummary(request: PaymentRequestItem): string {
  if (request.paymentMethod === "MPESA") return `M-Pesa · ${request.releaseReference ?? "—"}`;
  if (request.paymentMethod === "CHEQUE") return `Cheque ${request.chequeNumber ?? ""} · ${request.chequeBank ?? ""}`.trim();
  if (request.paymentMethod === "MANUAL") return `Manual · ${request.releaseReference ?? "—"}`;
  return request.releaseReference ? `Released · ${request.releaseReference}` : "—";
}

/**
 * How an agent payment was paid and its proof, the same for the Accounts Office, the Admin and the agent:
 * not yet paid; or the mode (M-Pesa code / cheque number, bank and date / manual reference), the day, who
 * recorded it, the note and the attached proof.
 */
export function PaymentProof({ request, payer = "the Accounts Office" }: { request: PaymentRequestItem; payer?: string }) {
  if (request.status === "APPROVED") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-main/40 bg-amber-main/5 p-4">
        <Icon name="schedule" className="mt-0.5 text-[20px] text-amber-main" />
        <div>
          <p className="font-semibold text-on-surface">Waiting to be paid · {formatKes(request.amount)}</p>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {payer.charAt(0).toUpperCase() + payer.slice(1)} pays this invoice and records how. The Admin and the agent are told when it is paid.
          </p>
        </div>
      </div>
    );
  }

  if (request.status !== "RELEASED") {
    return <p className="text-sm text-on-surface-variant">This payment is {request.status.toLowerCase()}.</p>;
  }

  const method = request.paymentMethod ?? null;
  const rows: { label: string; value: string; mono?: boolean }[] = [];
  if (method === "MPESA") rows.push({ label: "M-Pesa code", value: request.releaseReference ?? "—", mono: true });
  if (method === "CHEQUE") {
    rows.push({ label: "Cheque number", value: request.chequeNumber ?? "—", mono: true });
    rows.push({ label: "Bank", value: request.chequeBank ?? "—" });
    rows.push({ label: "Date on cheque", value: request.chequeDate ? formatDate(request.chequeDate) : "—" });
  }
  if (method === "MANUAL") rows.push({ label: "Reference", value: request.releaseReference ?? "—" });
  if (!method) rows.push({ label: "Reference", value: request.releaseReference ?? "—" });
  rows.push({ label: "Paid on", value: request.paidOn ? formatDate(request.paidOn) : request.releasedAt ? formatDate(request.releasedAt) : "—" });
  rows.push({ label: "Recorded by", value: request.releasedByName ?? "—" });

  return (
    <div className="rounded-lg border border-tertiary/30 bg-tertiary-container/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="check_circle" className="text-[20px] text-tertiary" />
        <p className="font-semibold text-on-surface">Paid · {formatKes(request.amount)}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-0.5 text-xs font-semibold text-primary">
          <Icon name={method ? METHOD_ICON[method] : "payments"} className="text-[14px]" />
          {method ? PAYMENT_METHOD_LABEL[method] : "Released"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 justify-between gap-3 border-b border-outline-variant/20 pb-1">
            <dt className="text-on-surface-variant">{row.label}</dt>
            <dd className={`min-w-0 break-words text-right font-medium text-on-surface ${row.mono ? "font-mono" : ""}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {request.paymentNote ? <p className="mt-3 text-sm text-on-surface-variant">Note: {request.paymentNote}</p> : null}
      {request.hasEvidence ? (
        <a
          href={evidenceHref(request.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-fixed"
        >
          <Icon name="attach_file" className="text-[18px]" />
          View proof of payment
        </a>
      ) : method ? (
        <p className="mt-3 text-xs text-outline">No proof file attached.</p>
      ) : null}
    </div>
  );
}
