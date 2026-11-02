import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";

import { AgentForm } from "../_components/agent-form";

/** Register a labour agent. */
export default async function NewAgentPage() {
  await requirePermission("agent:write");

  return (
    <>
      <PageHeader title="Register Agent" description="The company, its service fee and its director." />
      <AgentForm />
    </>
  );
}
