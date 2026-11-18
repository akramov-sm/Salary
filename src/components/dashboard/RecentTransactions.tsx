"use client";

import Link from "next/link";
import { useTransactionSheet } from "@/components/providers/AppProviders";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import type { TxDTO } from "@/lib/types";

export function RecentTransactions({ items }: { items: TxDTO[] }) {
  const { openEdit } = useTransactionSheet();
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">Последние операции</h2>
        <Link href="/transactions" className="text-xs text-mint hover:underline">
          Все
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          Операций пока нет. Нажмите «+», чтобы добавить первую.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map((t) => (
            <TransactionRow key={t.id} tx={t} onSelect={openEdit} />
          ))}
        </ul>
      )}
    </section>
  );
}
