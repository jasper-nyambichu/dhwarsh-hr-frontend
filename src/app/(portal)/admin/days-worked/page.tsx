import { DaysWorkedPanel } from "@/components/features/backoffice/days-worked-panel";

/** Admin reviews the days worked per branch, counted live from attendance. */
export default async function AdminDaysWorkedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DaysWorkedPanel params={await searchParams} basePath="/admin/days-worked" />;
}