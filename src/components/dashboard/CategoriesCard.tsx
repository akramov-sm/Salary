"use client";

import { CircleDollarSign } from "lucide-react";
import { Money } from "@/components/ui/money";
import { Sparkline } from "./Sparkline";
import { useCategories } from "@/components/providers/AppProviders";
import type { DashboardStats } from "@/lib/types";

export function CategoriesCard({
  rows,
  total,
}: {
  rows: DashboardStats["monthCategories"];
  total: number;
}) {
  const { categoryById } = useCategories();
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-text-secondary">Расходы по категориям</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">В этом месяце расходов пока нет.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((c) => {
            const cat = categoryById(c.categoryId);
            const Icon = cat?.icon ?? CircleDollarSign;
            return (
              <li key={c.categoryId} className="flex items-center gap-3 py-3">
                <Icon className="size-5 shrink-0 text-text-secondary" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{cat?.name ?? "Категория"}</div>
                  <div className="money text-xs text-text-muted">
                    {total > 0 ? Math.round((c.amount / total) * 100) : 0}%
                  </div>
                </div>
                <Sparkline
                  data={c.series}
                  color="var(--cyan)"
                  fill={false}
                  className="h-6 w-10 shrink-0 sm:w-16"
                />
                <Money amount={c.amount} className="shrink-0 text-right text-sm sm:w-32" />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
