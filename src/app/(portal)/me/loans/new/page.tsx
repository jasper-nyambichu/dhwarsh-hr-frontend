import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

import { LoanRequestForm } from "./_components/loan-request-form";

/** New loan request — the employee states the amount and what they can repay monthly. */
export default async function NewLoanRequestPage() {
  await requirePermission("loan:request");

  return (
    <div className="bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-variant bg-surface/80 px-container-margin py-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/me/loans"
            aria-label="Back to loans"
            className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <h1 className="font-page-title text-page-title text-primary">New Loan Request</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Tell us how much you need and what you can repay each month.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl p-container-margin">
        <LoanRequestForm />
      </main>
    </div>
  );
}