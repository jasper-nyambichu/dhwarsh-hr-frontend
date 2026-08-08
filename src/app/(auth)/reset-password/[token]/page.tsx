import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({
  params,
}: PageProps<"/reset-password/[token]">) {
  // params is a Promise in Next 16.
  const { token } = await params;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1">
        <h1 className="mb-2 font-login-title text-login-title text-navy">
          Choose a new password
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Awaiting Stitch screen. Token: {token.slice(0, 8)}…
        </p>
      </div>
    </div>
  );
}
