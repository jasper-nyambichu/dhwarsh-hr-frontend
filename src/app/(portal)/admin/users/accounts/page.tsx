import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { CredentialCard } from "@/components/features/users/credential-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getOrganisationBranding } from "@/lib/api/organisation";
import { getUsers } from "@/lib/api/user";
import type { UserSummaryResponse } from "@/types";

/**
 * Users → Accounts Office: the logins of the people who pay the agent invoices. One card per login (change the
 * username, email or password, or delete it) and an empty card to add another. Only where the organisation uses
 * the Accounts Office; elsewhere this page does not exist.
 */
export default async function UserAccountsOfficePage() {
  await requirePermission("user:manage");

  const { accountsOffice } = await getOrganisationBranding();
  if (!accountsOffice) notFound();

  let users: UserSummaryResponse[];
  try {
    users = await getUsers();
  } catch (error) {
    return <DataUnavailable title="Accounts Office" subject="The Accounts Office logins" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const logins = users.filter((user) => user.role === "FINANCE_OFFICER");

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/users"
              aria-label="Back to users"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            Accounts Office
          </span>
        }
        description="Set the username and password for each person in the Accounts Office, then share them. They sign in on the Accounts login page."
      />

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-2">
        {logins.map((user) => (
          <CredentialCard
            key={user.id}
            title={user.displayName ?? "Accounts Office"}
            subtitle="Pays the agent invoices"
            where="the Accounts Office portal"
            account={user}
            role="FINANCE_OFFICER"
            signInPath="/accounts/login"
          />
        ))}
        <CredentialCard
          key={`new-${logins.length}`}
          title={logins.length === 0 ? "Accounts Office login" : "Add another login"}
          subtitle="A new login for the Accounts Office"
          where="the Accounts Office portal"
          account={null}
          role="FINANCE_OFFICER"
          signInPath="/accounts/login"
        />
      </div>
    </>
  );
}
