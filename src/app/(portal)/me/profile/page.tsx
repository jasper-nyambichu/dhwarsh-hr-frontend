// src/app/(portal)/me/profile/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";
import { ProfileForm, type ProfileFormData } from "./_components/profile-form";
import { AvatarUpload } from "./_components/avatar-upload";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<Employee>("/me")`. Employment
 * details (employee no, hire date, department, branch) are read-only,
 * sourced from the base record — not part of the editable form.
 * ─────────────────────────────────────────────────────────────────────────
 */
const PROFILE: ProfileFormData & { avatarUrl: string; fullName: string; title: string } = {
  firstName: "Taruk",
  lastName: "Makena",
  dateOfBirth: "1988-10-12",
  gender: "Female",
  maritalStatus: "Married",
  email: "amina.yusuf@dhwarsh.com",
  phone: "+254 712 345 678",
  address: "Apt 4B, Sunset Apartments, Westlands, Nairobi",
  avatarUrl: "/avatars/taruk.jpg",
  fullName: "Taruk Makena",
  title: "Senior Marketing Executive",
};

const EMPLOYMENT = {
  employeeNo: "EMP-2021-042",
  hireDate: "Mar 15, 2021",
  department: "Marketing",
  branch: "Nairobi CBD",
};

export default async function MyProfilePage() {
  await requirePermission("employee:read:self");
  const profile = PROFILE;

  return (
    /* No h-full/overflow-hidden here: the portal shell already owns the scroll
       container, and a nested one produces two scrollbars and a header that
       scrolls away from its own content. */
    <div className="relative flex flex-col">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/me/dashboard"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Back to dashboard"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-display-greeting text-lg text-primary sm:text-display-greeting">My Profile</h1>
      </div>

      <div>
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
          <section className="group relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-ambient-1 transition-shadow duration-300 hover:shadow-ambient-2 sm:p-8 md:flex-row md:items-start md:gap-8">
            <div className="absolute left-0 top-0 h-32 w-full bg-gradient-to-r from-primary-container/10 to-transparent" />
            <div className="relative z-10 shrink-0">
              <AvatarUpload src={profile.avatarUrl} alt={profile.fullName} />
            </div>
            <div className="relative z-10 flex-1 pt-2 text-center md:pt-4 md:text-left">
              <h2 className="mb-1 text-2xl text-primary">{profile.fullName}</h2>
              <p className="flex items-center justify-center gap-1 text-sm text-on-surface-variant md:justify-start">
                <Icon name="work" className="text-[16px]" />
                {profile.title}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
            <ProfileForm initial={profile} />

            <div className="space-y-gutter md:col-span-4">
              <div className="relative overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-low p-6 shadow-sm">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(#005592 1px, transparent 1px)", backgroundSize: "16px 16px" }}
                />
                <div className="relative z-10">
                  <h3 className="mb-6 flex items-center gap-2 border-b border-outline-variant/30 pb-2 text-[10px] font-semibold uppercase text-secondary">
                    <Icon name="badge" className="text-[18px]" />
                    Employment Details
                  </h3>
                  <div className="space-y-4">
                    <ReadOnlyField label="Employee No" value={EMPLOYMENT.employeeNo} />
                    <ReadOnlyField label="Hire Date" value={EMPLOYMENT.hireDate} />
                    <ReadOnlyField label="Department" value={EMPLOYMENT.department} />
                    <ReadOnlyField label="Branch" value={EMPLOYMENT.branch} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name="lock" className="mt-0.5 text-[16px] text-outline" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-outline">{label}</p>
        <p className="text-sm font-medium text-on-surface">{value}</p>
      </div>
    </div>
  );
}