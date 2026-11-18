"use client";

import { Wallet } from "lucide-react";
import { Money } from "@/components/ui/money";
import { Sparkline } from "./Sparkline";
import { useSettings } from "@/components/providers/AppProviders";
import { CURRENCIES } from "@/lib/currency";
import { formatPct } from "@/lib/format";

export function BalanceCard({
  balance,
  changePct,
  trend,
}: {
  balance: number;
  changePct: number | null;
  trend: number[];
}) {
  const { currency } = useSettings();
  const up = (changePct ?? 0) >= 0;
  return (
    <section className="relative overflow-hidden rounded-md border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span className="flex items-center gap-2">
          <Wallet className="size-4" strokeWidth={1.5} /> Общий баланс
        </span>
        <span className="rounded-md border border-border px-2 py-0.5 text-xs">
          {currency} · {CURRENCIES[currency].symbol}
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        <Money amount={balance} />
      </div>
      <div className={`mt-1 text-sm font-medium ${up ? "text-mint" : "text-expense"}`}>
        {changePct === null ? (
          <span className="font-normal text-text-muted">Недостаточно данных для динамики</span>
        ) : (
          <>
            <span className="money">
              {up ? "▲" : "▼"} {formatPct(changePct, true)}
            </span>{" "}
            <span className="font-normal text-text-secondary">за месяц</span>
          </>
        )}
      </div>
      <Sparkline data={trend} className="mt-5 h-16 w-full sm:h-20" strokeWidth={1.5} />
      <div className="mt-1 flex justify-between text-xs text-text-muted">
        <span>30 дней назад</span>
        <span>сегодня</span>
      </div>
    </section>
  );
}
