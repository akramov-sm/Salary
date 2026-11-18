import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { CategoriesCard } from "@/components/dashboard/CategoriesCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { computeStats, recentTransactions } from "@/db/queries";
import { getCurrentUser } from "@/lib/session";
import { getUserTz } from "@/lib/server-tz";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout уже показал экран «сессия недействительна»

  const [stats, recent] = await Promise.all([
    computeStats(user.id, await getUserTz()),
    recentTransactions(user.id, 5),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="md:col-span-2 lg:col-span-2">
        <BalanceCard balance={stats.balance} changePct={stats.balanceChangePct} trend={stats.balanceTrend} />
      </div>
      <StatCard kind="income" amount={stats.income} changePct={stats.incomeChangePct} trend={stats.incomeTrend} />
      <StatCard kind="expense" amount={stats.expense} changePct={stats.expenseChangePct} trend={stats.expenseTrend} />
      <div className="md:col-span-2 lg:col-span-2">
        <CategoriesCard rows={stats.monthCategories.slice(0, 5)} total={stats.expense} />
      </div>
      <div className="md:col-span-2 lg:col-span-2">
        <RecentTransactions items={recent} />
      </div>
    </div>
  );
}
