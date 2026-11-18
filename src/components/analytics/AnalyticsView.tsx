"use client";

import { CircleDollarSign, PiggyBank, Receipt, Trophy } from "lucide-react";
import { Money } from "@/components/ui/money";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { useCategories } from "@/components/providers/AppProviders";
import type { DashboardStats } from "@/lib/types";

function Insight({
  icon: Icon,
  label,
  children,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
  hint: string;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="size-4" strokeWidth={1.5} /> {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{children}</div>
      <div className="mt-1 text-xs text-text-muted">{hint}</div>
    </section>
  );
}

export function AnalyticsView({ stats }: { stats: DashboardStats }) {
  const { categoryById } = useCategories();

  const top = stats.monthCategories[0];
  const topCat = top ? categoryById(top.categoryId) : undefined;
  const savings = stats.savingsRate;
  const monthTotal = stats.expense;

  const max = Math.max(1, ...stats.dailyIncome, ...stats.dailyExpense);
  const domain: [number, number] = [0, max];
  const empty = stats.dailyIncome.every((v) => v === 0) && stats.dailyExpense.every((v) => v === 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Аналитика</h1>
        <p className="mt-1 text-sm text-text-secondary">Последние 30 дней</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Insight icon={Trophy} label="Топ категория трат" hint={top ? "в этом месяце" : "пока нет трат в этом месяце"}>
          {topCat ? (
            <span className="flex items-center gap-2">
              <topCat.icon className="size-5 text-text-secondary" strokeWidth={1.5} />
              {topCat.name}
            </span>
          ) : (
            "—"
          )}
        </Insight>
        <Insight icon={Receipt} label="Средний расход в день" hint="за 30 дней">
          <Money amount={stats.avgDailyExpense} />
        </Insight>
        <Insight icon={PiggyBank} label="Процент сбережений" hint="доходы минус расходы от доходов, за месяц">
          {savings === null ? (
            <span className="text-text-muted">—</span>
          ) : (
            <span className={`money ${savings >= 0 ? "text-mint" : "text-expense"}`}>{savings}%</span>
          )}
        </Insight>
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-text-secondary">Доходы и расходы по дням</h2>
          <div className="flex gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-mint" /> Доходы
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-expense" /> Расходы
            </span>
          </div>
        </div>
        <div className="relative mt-5 h-48 sm:h-60">
          <Sparkline data={stats.dailyIncome} domain={domain} color="var(--mint)" className="absolute inset-0 h-full w-full" />
          <Sparkline data={stats.dailyExpense} domain={domain} color="var(--expense)" className="absolute inset-0 h-full w-full" />
          {empty && (
            <p className="absolute inset-0 grid place-items-center text-sm text-text-muted">
              За 30 дней операций нет
            </p>
          )}
        </div>
        <div className="mt-1 flex justify-between text-xs text-text-muted">
          <span>30 дней назад</span>
          <span>сегодня</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-text-secondary">Динамика баланса</h2>
          <Sparkline data={stats.balanceTrend} className="mt-5 h-32 w-full" />
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-text-secondary">Структура расходов за месяц</h2>
          {stats.monthCategories.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">Нет расходов за этот месяц.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.monthCategories.slice(0, 5).map((r) => {
                const c = categoryById(r.categoryId);
                const Icon = c?.icon ?? CircleDollarSign;
                const pct = monthTotal > 0 ? Math.round((r.amount / monthTotal) * 100) : 0;
                return (
                  <li key={r.categoryId}>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="size-4 text-text-secondary" strokeWidth={1.5} />
                      <span className="flex-1 truncate">{c?.name}</span>
                      <span className="money text-xs text-text-muted">{pct}%</span>
                      <Money amount={r.amount} className="w-28 text-right" />
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
