import { AccountScreen } from "@/components/features/profile/account-screen";

export default function ProfilePage() {
  return <AccountScreen basePath="/agent" links={[{ title: "Agency details", href: "/agent/profile/agency", icon: "handshake" }]} />;
}
