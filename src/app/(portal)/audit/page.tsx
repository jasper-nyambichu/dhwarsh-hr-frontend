import { redirect } from "next/navigation";

/** `/audit` has no screen of its own — the Auditor's home is the dashboard. */
export default function AuditIndexPage() {
  redirect("/audit/dashboard");
}