import { redirect } from "next/navigation";

/** `/backoffice` has no screen of its own — the portal home is the dashboard. */
export default function BackOfficeIndexPage() {
  redirect("/backoffice/dashboard");
}