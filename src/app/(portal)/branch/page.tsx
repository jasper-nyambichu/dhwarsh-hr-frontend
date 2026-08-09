// src/app/(portal)/branch/team/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<TeamMember[]>("/branch/team")`.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface TeamMember {
  id: string;
  name: string;
  initials?: string;
  avatarUrl?: string;
  department: string;
  jobTitle: string;
  employmentType: "Full-time" | "Contract";
  status: "Active" | "On Leave" | "Inactive";
}

const TEAM: TeamMember[] = [
  { id: "EMP-042", name: "Sarah Jenkins", avatarUrl: "/avatars/sarah.jpg", department: "Retail Banking", jobTitle: "Teller", employmentType: "Full-time", status: "Active" },
  { id: "EMP-108", name: "Michael Kimani", initials: "MK", department: "Wealth Management", jobTitle: "Advisor", employmentType: "Full-time", status: "Active" },
  { id: "EMP-088", name: "David Omondi", avatarUrl: "/avatars/david.jpg", department: "Security", jobTitle: "Guard", employmentType: "Contract", status: "On Leave" },
  { id: "EMP-112", name: "Amina Ndungu", initials: "AN", department: "Customer Service", jobTitle: "Representative", employmentType: "Full-time", status: "Active" },
  { id: "EMP-133", name: "Fatuma Hassan", avatarUrl: "/avatars/fatuma.jpg", department: "Operations", jobTitle: "Manager", employmentType: "Full-time", status: "Active" },
  { id: "EMP-140", name: "Peter Kamau", initials: "PK", department: "IT Support", jobTitle: "Technician", employmentType: "Contract", status: "Active" },
  { id: "EMP-151", name: "James Waweru", avatarUrl: "/avatars/james.jpg", department: "Retail Banking", jobTitle: "Teller", employmentType: "Full-time", status: "Inactive" },
  { id: "EMP-160", name: "Lucy Njoroge", initials: "LN", department: "Administration", jobTitle: "Clerk", employmentType: "Full-time", status: "Active" },
];

function statusDot(status: TeamMember["status"]) {
  if (status === "Active") return "bg-tertiary";
  if (status === "On Leave") return "bg-error";
  return "bg-outline";
}

function typeChipClass(type: TeamMember["employmentType"]) {
  return type === "Full-time" ? "bg-secondary-container/50 text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant";
}

export default async function TeamDirectoryPage() {
  await requirePermission("employee:read:branch");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">My Team</h1>
          <p className="mt-1 text-xs text-on-surface-variant">Manage and deploy branch staff.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-primary-container transition-colors hover:bg-secondary-container/80">
            <Icon name="filter_list" className="text-[18px]" />
            Filter
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary/90">
            <Icon name="person_add" className="text-[18px]" />
            Deploy Staff
          </button>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl bg-white p-6 shadow-ambient-1">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-container-highest">
                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Employee</th>
                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Department</th>
                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Job Title</th>
                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Type</th>
                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface">
              {TEAM.map((member) => (
                <tr key={member.id} className="border-b border-surface-container-highest transition-colors hover:bg-surface-container-low">
                  <td className="py-4">
                    <Link href={`/branch/team/${member.id}`} className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="size-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                          {member.initials}
                        </div>
                      )}
                      <span className="font-medium text-on-surface hover:underline">{member.name}</span>
                    </Link>
                  </td>
                  <td className="py-4 text-on-surface-variant">{member.department}</td>
                  <td className="py-4 text-on-surface-variant">{member.jobTitle}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${typeChipClass(member.employmentType)}`}>
                      {member.employmentType}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`size-2 rounded-full ${statusDot(member.status)}`} />
                      <span className="text-on-surface-variant">{member.status}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-primary transition-colors hover:text-primary-container">
                      <Icon name="more_vert" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-surface-container-highest pt-4">
          <span className="text-sm text-on-surface-variant">Showing 1 to {TEAM.length} of 24 employees</span>
          <div className="flex gap-2">
            <button className="rounded-md border border-outline-variant px-3 py-1 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="rounded-md border border-outline-variant px-3 py-1 text-sm text-on-surface-variant transition-colors hover:bg-surface-container">
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}