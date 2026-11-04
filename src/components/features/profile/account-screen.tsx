import Link from "next/link";
import type { ReactNode } from "react";

import { ApiError } from "@/app/lib/api-error";
import { verifySession } from "@/app/lib/dal";
import { PhotoSection, ProfileForm } from "@/components/features/profile/account-forms";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/ui/icon";
import { getMyProfile, type MyProfile } from "@/lib/api/profile";
import { cn } from "@/lib/utils";

type AccountLink = { title: string; href: string; icon: string };

/** The two-panel frame: who you are and where to go on the left, the page on the right. */
export function AccountFrame({
  name,
  photoVersion,
  links,
  active,
  title,
  children,
}: {
  name: string;
  photoVersion: number | null;
  links: AccountLink[];
  active: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bento-card flex min-w-0 flex-col overflow-hidden lg:flex-row">
      <aside className="shrink-0 border-b border-outline-variant/40 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 border-b border-outline-variant/40 p-5">
          <UserAvatar name={name} photoVersion={photoVersion} size={40} />
          <p className="min-w-0 break-words font-semibold text-on-surface">{name}</p>
        </div>
        <nav aria-label="Your account" className="p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-medium text-outline">Your account</p>
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.href === active ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    link.href === active ? "bg-surface-container-low text-on-surface" : "text-on-surface-variant hover:bg-surface-container-low",
                  )}
                >
                  <Icon name={link.icon} className="text-[20px]" />
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <h1 className="border-b border-outline-variant/40 px-5 py-5 font-page-title text-page-title text-on-surface sm:px-6">{title}</h1>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/** Splits the single stored name for the two fields: the first word, then the rest. */
function splitName(name: string): { first: string; last: string } {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

/** Every portal's profile page. `links` adds anything else that portal keeps in its account area. */
export async function AccountScreen({ basePath, links = [] }: { basePath: string; links?: AccountLink[] }) {
  const session = await verifySession();

  let profile: MyProfile;
  try {
    profile = await getMyProfile();
  } catch (error) {
    return <DataUnavailable title="Account" subject="Your profile" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const name = profile.displayName?.trim() || profile.username;
  const { first, last } = splitName(name);
  const photoVersion = profile.hasPhoto ? (session.photoVersion ?? 1) : null;
  const href = `${basePath}/profile`;

  return (
    <AccountFrame
      name={name}
      photoVersion={photoVersion}
      links={[{ title: "Profile", href, icon: "account_circle" }, ...links]}
      active={href}
      title="Account"
    >
      <PhotoSection name={name} photoVersion={photoVersion} />
      {/* A new key after saving picks up the saved values as the new starting point. */}
      <ProfileForm
        key={`${name}|${profile.email ?? ""}`}
        firstName={first}
        lastName={last}
        username={profile.username}
        email={profile.email ?? ""}
      />
    </AccountFrame>
  );
}
