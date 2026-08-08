import { redirect } from "next/navigation";

/** Namespace root — send straight to this role's dashboard. */
export default function Page() {
  redirect("/audit/dashboard");
}
