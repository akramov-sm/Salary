import { CategoriesView } from "@/components/categories/CategoriesView";
import { categoryTotals, computeStats } from "@/db/queries";
import { getCurrentUser } from "@/lib/session";
import { getUserTz } from "@/lib/server-tz";

export const metadata = { title: "Категории — Salary" };

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [totals, stats] = await Promise.all([
    categoryTotals(user.id),
    computeStats(user.id, await getUserTz()),
  ]);
  return <CategoriesView totals={totals} series={stats.catSeries14} />;
}
