import { DaysWorkedPanel } from "@/components/features/backoffice/days-worked-panel";

/** Admin sits outside the /backoffice namespace but can review, and is the only role that can unlock a period. */
export default async function AdminDaysWorkedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DaysWorkedPanel params={await searchParams} basePath="/admin/days-worked" />;
}