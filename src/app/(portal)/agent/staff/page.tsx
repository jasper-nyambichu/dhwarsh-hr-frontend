//src/app/(portal)/agent/staff/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * Agent Portal — deployed staff roster.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * The agent portal shares no components with the admin/employee bento
 * layouts in the source design (different nav labels: Staff, Summaries,
 * Invoices, Advances, Profile) — treated as its own route group with its
 * own shell rather than reusing PageHeader/BentoCard, since those weren't
 * confirmed to fit this visual style. If PageHeader/BentoCard are meant to
 * be used everywhere, tell me and I'll refactor this to match.
 * ─────────────────────────────────────────────────────────────────────────
 */

type StaffStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE" | "PENDING_REVIEW";

type StaffRow = {
  id: number;
  name: string;
  employeeCode: string;
  avatarUrl: string | null;
  initials: string;
  initialsColorClassName: string;
  branch: string;
  role: string;
  deployedFrom: string;
  rateKes: number;
  status: StaffStatus;
  muted?: boolean;
};

const STAFF: readonly StaffRow[] = [
  { id: 1, name: "Amina Yusuf", employeeCode: "EMP-8492", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdufcPA-tUqCH6pE5yeWKi9yOm3rdtWAUybxCEDLsmK4PQnrZBz2qPtoXPttKV3ddo6iOiW5D6GxuyXzwYxvy-kDiiiPygjPkm4E33y6t5n9uTaS-zKIrRzqUkio4YvUWHnGxrJd8KW3CnnzTTR00neXm2Rr6tX1Ox-cwRsQD6sE7ZqZwO4kCa2b_7OXEm8jJxUozPXpLQ5VgD1xNcRlnUXhbg1tRN7I_5GxGrI6Sd2af_Cz9v2jck", initials: "AY", initialsColorClassName: "", branch: "Westlands HQ", role: "Data Analyst", deployedFrom: "12 Mar, 2023", rateKes: 85000, status: "ACTIVE" },
  { id: 2, name: "David Omondi", employeeCode: "EMP-7731", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8nXx2KtbS9xN4YTxnuNe3SAZqWTRiH5Hfms9KMG3GI3xXmjvox8yXnLbpI2ntxMq0BHpwnZHmYwtL0j1-S5H08xKjixPAihggdGCJN-P14hQ1Jjs_Pf8EAZNwxNjfbQZvQE_MUZ2ossBn6A6vU6AoHDTuVH7WCvVbeSiKPKb47Swenv1tc4tc1BMMi_DSN64PnLPIXSqxo8E9nZ44SWgo8BLo1ZuBYcLwY9vSSXw1eHn4vlSvF0GE", initials: "DO", initialsColorClassName: "", branch: "Mombasa Branch", role: "Logistics Coord", deployedFrom: "05 Jan, 2023", rateKes: 62500, status: "ACTIVE" },
  { id: 3, name: "Grace Wanjiku", employeeCode: "EMP-9012", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmry9ka-kPXkYEFbzK1hJf5y9Fg92U1YdhfKkG4EQZHYmFvIUlP2vFGOsnqef6lVhb9wpiSv89nNowp3zbCTBkLNsHXPCLlWT-qN1rzOUxsu2TDGbpS9Pqcd5HSUxIOiHjn2_8MrWyxbOm70f1BHpir_sq2L5OaGYzhQWGiGDsUK4bT9aPFVyWIqXu2utgJsZDave5yhiNwcx-OUwZlTOz_XdUxuVCcWDxFllX2Ze-1UpZ_F6zqzC9", initials: "GW", initialsColorClassName: "", branch: "Kisumu Hub", role: "HR Specialist", deployedFrom: "22 Jul, 2022", rateKes: 95000, status: "ON_LEAVE" },
  { id: 4, name: "James Njoroge", employeeCode: "EMP-6643", avatarUrl: null, initials: "JN", initialsColorClassName: "bg-orange-100 text-orange-700", branch: "Nakuru Branch", role: "Sales Exec", deployedFrom: "15 Nov, 2023", rateKes: 45000, status: "ACTIVE" },
  { id: 5, name: "Brian Mutua", employeeCode: "EMP-5521", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZns1gBNQI9qzBetGb68wd1i8PScx4Xs_fjQv4Um8lXMiGUWZ8eTZB5KCgl_5xXmnDvE5HsOHGd9lwWEj2zebtYohb9wZg7XLHWT2_WaNCz88FmYj0e95AaLs-NhPYqu1qUQgGbO8U31UwNbNPec7eYg6WQGw_QLddAKbNP7Bx8S6Df-ciw-2uhkDfVZDCmJWG7eARYfFW_pKHEkovLeDSaWp4ktn9BMjHxSDchUPt-I1uaOSdINt3", initials: "BM", initialsColorClassName: "", branch: "Westlands HQ", role: "IT Support", deployedFrom: "01 Feb, 2024", rateKes: 70000, status: "ACTIVE" },
  { id: 6, name: "Fatuma Ali", employeeCode: "EMP-3390", avatarUrl: null, initials: "FA", initialsColorClassName: "bg-gray-200 text-gray-500", branch: "Mombasa Branch", role: "Clerk", deployedFrom: "10 Aug, 2021", rateKes: 35000, status: "INACTIVE", muted: true },
  { id: 7, name: "Sarah Kipkemboi", employeeCode: "EMP-4412", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGjElD0JR7IMZyydF5GzYMK7vI_BF-PajOBn_eqkQov9s6iwffaZpG6JERBxvkvPgJEw7RzAxvY0z-Zj4ww3sdGBirXxMI5xspxkJNC0hXrApunlPkUDqNFNGLsEbOom3LdhxaEcBhNJCXCT2TnNlCuzJMeyuw-kqaku0bkM2CWXusMC4YSow20q7DEf_uDBRyRaERh1p0yjKD2N5xrCpAF1VpYtFt1ec_XQBSnedEzlQb-2dcaVWk", initials: "SK", initialsColorClassName: "", branch: "Eldoret Branch", role: "Branch Manager", deployedFrom: "01 May, 2020", rateKes: 120000, status: "ACTIVE" },
  { id: 8, name: "Peter Kamau", employeeCode: "EMP-2287", avatarUrl: null, initials: "PK", initialsColorClassName: "bg-blue-100 text-blue-700", branch: "Westlands HQ", role: "Accountant", deployedFrom: "18 Sep, 2023", rateKes: 82000, status: "PENDING_REVIEW" },
];

const STATUS_META: Record<StaffStatus, { label: string; className: string; dotClassName: string }> = {
  ACTIVE: { label: "Active", className: "bg-tertiary-fixed/20 text-tertiary-container", dotClassName: "bg-tertiary-container" },
  ON_LEAVE: { label: "On Leave", className: "bg-error-container/40 text-on-error-container", dotClassName: "bg-error" },
  INACTIVE: { label: "Inactive", className: "bg-surface-variant text-on-surface-variant", dotClassName: "bg-outline" },
  PENDING_REVIEW: { label: "Pending Review", className: "bg-orange-100 text-orange-700", dotClassName: "bg-orange-500" },
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE").format(amount);
}

export default async function DeployedStaffPage() {
  await requirePermission("agent:read:self");

  return (
    <main className="flex-grow overflow-y-auto p-container-margin">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-on-surface">My Deployed Staff</h2>
          <p className="text-sm text-on-surface-variant">Manage and track your currently active deployed personnel.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary active:scale-95">
          <Icon name="add" className="text-[18px]" />
          Deploy Staff
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex h-[calc(100vh-280px)] min-h-[400px] flex-col rounded-bento border border-line bg-white shadow-bento transition-shadow duration-300 hover:shadow-bento-hover">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-bento border-b border-line bg-white p-card-padding">
            <h3 className="text-lg font-bold text-on-surface">Active Roster</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-fixed">
                <Icon name="filter_list" className="text-[16px]" />
                Filter
              </button>
              <button className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-fixed">
                <Icon name="download" className="text-[16px]" />
                Export
              </button>
            </div>
          </div>

          <div className="table-container flex-grow overflow-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-surface-container-low font-table-header uppercase text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Deployed From</th>
                  <th className="px-6 py-3 text-right font-semibold">Rate (KES)</th>
                  <th className="px-6 py-3 text-center font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-body-md text-sm text-on-surface">
                {STAFF.map((person) => {
                  const status = STATUS_META[person.status];
                  return (
                    <tr
                      key={person.id}
                      className={`group cursor-pointer transition-colors hover:bg-surface ${person.muted ? "opacity-70" : ""}`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {person.avatarUrl ? (
                            <img src={person.avatarUrl} alt={person.name} className="size-8 rounded-full object-cover" />
                          ) : (
                            <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${person.initialsColorClassName}`}>
                              {person.initials}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-on-surface transition-colors group-hover:text-primary">{person.name}</div>
                            <div className="text-xs text-outline">ID: {person.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant">{person.branch}</td>
                      <td className="px-6 py-3">
                        <span className="rounded-md bg-secondary-fixed px-2 py-1 text-[11px] font-semibold text-on-secondary-fixed">
                          {person.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant">{person.deployedFrom}</td>
                      <td className="px-6 py-3 text-right font-medium">{formatKes(person.rateKes)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          <span className={`size-1.5 rounded-full ${status.dotClassName}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button className="rounded p-1 text-outline transition-colors hover:bg-primary-fixed/50 hover:text-primary">
                          <Icon name="more_vert" className="text-[18px]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-b-bento border-t border-line bg-surface-bright p-4 text-sm text-on-surface-variant">
            <div>Showing {STAFF.length} to 8 of 45 entries</div>
            <div className="flex gap-1">
              <button className="rounded border border-line px-3 py-1 transition-colors hover:bg-surface disabled:opacity-50" disabled>
                Prev
              </button>
              <button className="rounded bg-primary px-3 py-1 text-white">1</button>
              <button className="rounded border border-line px-3 py-1 transition-colors hover:bg-surface">2</button>
              <button className="rounded border border-line px-3 py-1 transition-colors hover:bg-surface">3</button>
              <span className="px-2 py-1">...</span>
              <button className="rounded border border-line px-3 py-1 transition-colors hover:bg-surface">Next</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}