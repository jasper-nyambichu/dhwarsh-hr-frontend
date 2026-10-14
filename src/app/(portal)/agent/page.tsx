import { redirect } from "next/navigation";

/** `/agent` has no screen of its own — the portal home is the dashboard. */
export default function AgentIndexPage() {
  redirect("/agent/dashboard");
}