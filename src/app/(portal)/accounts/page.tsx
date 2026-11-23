import { redirect } from "next/navigation";

/** Namespace root — send straight to the Accounts Office dashboard. */
export default function Page() {
  redirect("/accounts/dashboard");
}
