// src/app/(portal)/branch/team/[employeeId]/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<EmployeeProfile>(`/employees/${employeeId}`)`.
 * ─────────────────────────────────────────────────────────────────────────
 */
const EMPLOYEE = {
  name: "Amina Yusuf",
  title: "Senior Marketing Executive",
  employeeId: "EMP-2021-042",
  hiredOn: "Mar 15, 2021",
  avatarUrl: "/avatars/amina.jpg",
  status: "Active" as const,
  personal: {
    fullName: "Amina Yusuf",
    dateOfBirth: "Oct 12, 1988",
    gender: "Female",
    nationality: "Kenyan",
    kraPin: "A001234567Z",
    nssfNumber: "123456789",
  },
  contact: {
    email: "amina.yusuf@dhwarsh.com",
    phone: "+254 712 345 678",
    address: "Apt 4B, Sunset Apartments, Westlands, Nairobi",
  },
  nextOfKin: {
    name: "Omar Yusuf",
    relationship: "Spouse",
    primaryPhone: "+254 722 987 654",
    altPhone: "N/A",
  },
  employment: {
    department: "Marketing",
    lineManager: "Sarah Ochieng",
    lineManagerAvatarUrl: "/avatars/sarah-ochieng.jpg",
    employmentType: "Full-Time Permanent",
    workLocation: "HQ - Nairobi Block A",
  },
};

export default async function EmployeeProfilePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employee:read:branch");
  const { employeeId } = await params;
  const employee = EMPLOYEE; // TODO: fetch by `employeeId` once the endpoint exists

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="size-24 rounded-full border-4 border-surface object-cover shadow-ambient-1"
            />
            {employee.status === "Active" && (
              <div className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-tertiary-fixed" title="Active">
                <Icon name="check" className="text-[14px] text-on-tertiary-fixed" />
              </div>
            )}
          </div>
          <div>
            <h1 className="mb-1 text-2xl font-bold text-on-surface">{employee.name}</h1>
            <p className="font-medium text-secondary">{employee.title}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <Icon name="badge" className="text-[16px]" />
                <span>{employee.employeeId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="calendar_month" className="text-[16px]" />
                <span>Hired: {employee.hiredOn}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-[#E6F0F8] px-4 py-2 font-semibold text-primary shadow-ambient-1 transition-colors hover:bg-secondary-container">
            <Icon name="chat" className="text-[18px]" />
            Message
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-2 font-semibold text-primary transition-colors hover:bg-[#E6F0F8]">
            <Icon name="calendar_add_on" className="text-[18px]" />
            Schedule Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8">
          <BentoCard title="Personal Information">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <Field label="Full Name" value={employee.personal.fullName} />
              <Field label="Date of Birth" value={employee.personal.dateOfBirth} />
              <Field label="Gender" value={employee.personal.gender} />
              <Field label="Nationality" value={employee.personal.nationality} />
              <Field label="KRA PIN" value={employee.personal.kraPin} />
              <Field label="NSSF Number" value={employee.personal.nssfNumber} />
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <BentoCard title="Contact Details">
            <div className="space-y-5">
              <ContactRow icon="mail" label="Email Address">
                <a href={`mailto:${employee.contact.email}`} className="text-sm text-primary hover:underline">
                  {employee.contact.email}
                </a>
              </ContactRow>
              <ContactRow icon="call" label="Phone Number">
                <span className="text-sm text-on-surface">{employee.contact.phone}</span>
              </ContactRow>
              <ContactRow icon="location_on" label="Current Address">
                <span className="text-sm text-on-surface">{employee.contact.address}</span>
              </ContactRow>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <BentoCard title="Next of Kin / Emergency">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Name" value={employee.nextOfKin.name} />
              <Field
                label="Relationship"
                value={
                  <span className="flex items-center gap-1">
                    <Icon name="family_restroom" className="text-[14px] text-secondary" />
                    {employee.nextOfKin.relationship}
                  </span>
                }
              />
              <Field label="Primary Phone" value={employee.nextOfKin.primaryPhone} />
              <Field label="Alternative Phone" value={employee.nextOfKin.altPhone} />
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <BentoCard title="Employment Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field
                label="Department"
                value={
                  <span className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary" />
                    {employee.employment.department}
                  </span>
                }
              />
              <Field
                label="Line Manager"
                value={
                  <span className="flex items-center gap-2">
                    <img src={employee.employment.lineManagerAvatarUrl} alt={employee.employment.lineManager} className="size-5 rounded-full" />
                    {employee.employment.lineManager}
                  </span>
                }
              />
              <Field label="Employment Type" value={employee.employment.employmentType} />
              <Field label="Work Location" value={employee.employment.workLocation} />
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase text-on-surface-variant">{label}</label>
      <div className="text-sm text-on-surface">{value}</div>
    </div>
  );
}

function ContactRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E6F0F8]">
        <Icon name={icon} className="text-[18px] text-primary" />
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-on-surface-variant">{label}</label>
        {children}
      </div>
    </div>
  );
}