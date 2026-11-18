"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { useCategories } from "@/components/providers/AppProviders";
import { CategoryDialog } from "./CategoryDialog";
import { pluralOps } from "@/lib/plural";

type Kind = "expense" | "income";

export function CategoriesView({
  totals,
  series,
}: {
  totals: Record<string, { total: number; count: number }>;
  series: Record<string, number[]>;
}) {
  const { categories } = useCategories();
  const [kind, setKind] = useState<Kind>("expense");
  const [dialogOpen, setDialogOpen] = useState(false);

  const list = categories.filter((c) => c.type === kind);
  const color = kind === "income" ? "var(--mint)" : "var(--expense)";

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Категории</h1>
          <p className="mt-1 text-sm text-text-secondary">Группы для доходов и расходов</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus /> Новая категория
        </Button>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
        <TabsList>
          <TabsTrigger value="expense">Расходы</TabsTrigger>
          <TabsTrigger value="income">Доходы</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const s = totals[c.id];
          const sr = series[c.id];
          return (
            <li key={c.id} className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <c.icon className="size-5 text-text-secondary" strokeWidth={1.5} />
                <span className="flex-1 truncate font-medium">{c.name}</span>
                {!c.isDefault && (
                  <span className="rounded-sm border border-border px-1.5 text-[10px] text-text-muted">
                    своя
                  </span>
                )}
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 text-xl font-semibold tracking-tight">
                <Money amount={s?.total ?? 0} />
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                {s?.count ?? 0} {pluralOps(s?.count ?? 0)} всего
              </div>
              {sr && sr.some((v) => v > 0) ? (
                <Sparkline data={sr} color={color} className="mt-4 h-8 w-full" />
              ) : (
                <div className="mt-4 h-8 border-b border-dashed border-border" />
              )}
            </li>
          );
        })}
      </ul>

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} kind={kind} />
    </div>
  );
}
