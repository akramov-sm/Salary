import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { computeStats } from "@/db/queries";
import { getCurrentUser } from "@/lib/session";
import { getUserTz } from "@/lib/server-tz";

export const metadata = { title: "Аналитика — Salary" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const stats = await computeStats(user.id, await getUserTz());
  return <AnalyticsView stats={stats} />;
}
