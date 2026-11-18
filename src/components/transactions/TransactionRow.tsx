"use client";

import { CircleDollarSign } from "lucide-react";
import { Money } from "@/components/ui/money";
import { useCategories } from "@/components/providers/AppProviders";
import { formatTxTime, isoToClock, isoToLocalDate } from "@/lib/date";
import type { TxDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransactionRow({
  tx,
  showCategory = false,
  onSelect,
}: {
  tx: TxDTO;
  showCategory?: boolean;
  /** Если задан, строка кликабельна (открывает редактирование). */
  onSelect?: (tx: TxDTO) => void;
}) {
  const { categoryById } = useCategories();
  const cat = categoryById(tx.categoryId);
  const Icon = cat?.icon ?? CircleDollarSign;
  const income = tx.type === "income";
  const date = isoToLocalDate(tx.occurredAt);
  const clock = isoToClock(tx.occurredAt);

  const body = (
    <>
      <Icon className="size-5 shrink-0 text-text-secondary" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{tx.description || cat?.name || "Операция"}</div>
        <div className="truncate text-xs text-text-muted">
          {showCategory ? `${cat ? `${cat.name} · ` : ""}${clock}` : formatTxTime(date, clock)}
        </div>
      </div>
      <span className={cn("shrink-0 text-sm font-medium", income ? "text-mint" : "text-foreground")}>
        {income ? "+" : "−"}
        <Money amount={tx.amount} />
      </span>
    </>
  );

  return (
    <li>
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(tx)}
          aria-label={`Редактировать: ${tx.description || cat?.name || "операция"}`}
          className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          {body}
        </button>
      ) : (
        <div className="flex items-center gap-3 py-3">{body}</div>
      )}
    </li>
  );
}
