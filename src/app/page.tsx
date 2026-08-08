import { redirect } from "next/navigation";

import { ROLE_HOME } from "@/config/roles";
import { getOptionalSession } from "@/app/lib/dal";

/**
 * Root. Sends a signed-in user to their role's dashboard and everyone else to
 * staff login. proxy.ts normally handles this first; this covers the case
 * where the matcher does not run.
 */
export default async function RootPage() {
  const session = await getOptionalSession();
  redirect(session ? ROLE_HOME[session.role] : "/login");
}
