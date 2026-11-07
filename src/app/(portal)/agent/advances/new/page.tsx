import { redirect } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";

/**
 * The advance request form lives on the Advances page, beside the agent's advances, and is wired to
 * `POST /agent-advances`. This address used to hold an unwired mock-up with made-up figures; it now
 * forwards there so old links and bookmarks still work.
 */
export default async function NewAgentAdvancePage() {
  await requirePermission("agentadvance:request");
  redirect("/agent/advances");
}
