import type { Metadata } from "next";

import { ResetLinkHandler } from "@/components/features/auth/reset-link-handler";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetLinkPage() {
  return <ResetLinkHandler />;
}
