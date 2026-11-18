"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Money } from "@/components/ui/money";
import { Sparkline } from "./Sparkline";
import { formatPct } from "@/lib/format";

type Props = {
  kind: "income" | "expense";
  amount: number;
  changePct: number | null;
  trend: number[];
};

export function StatCard({ kind, amount, changePct, trend }: Props) {
  const income = kind === "income";
  const color = income ? "var(--mint)" : "var(--expense)";
  const Arrow = income ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span className="flex items-center gap-2">
          <Arrow className="size-4" strokeWidth={1.5} style={{ color }} />
          {income ? "Доходы" : "Расходы"}
        </span>
        {changePct !== null && (
          <span className="money text-xs font-medium" style={{ color }}>
            {formatPct(changePct, true)}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">
        <Money amount={amount} />
      </div>
      <div className="mt-0.5 text-xs text-text-muted">за месяц</div>
      <Sparkline data={trend} color={color} className="mt-4 h-10 w-full" />
    </section>
  );
}
