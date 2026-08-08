import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1">
        <h1 className="mb-2 font-login-title text-login-title text-navy">
          Reset your password
        </h1>
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
          Awaiting Stitch screen.
        </p>
        <Link
          href="/login"
          className="font-body-md text-body-md font-semibold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
