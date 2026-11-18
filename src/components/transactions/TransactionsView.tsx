"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionSheet } from "@/components/providers/AppProviders";
import { getTransactions } from "@/actions/transaction.actions";
import { TransactionRow } from "./TransactionRow";
import { dayHeading, isoToLocalDate, periodFromISO, type Period } from "@/lib/date";
import { pluralOps } from "@/lib/plural";
import type { TxDTO, TxPage } from "@/lib/types";

type TypeFilter = "all" | "income" | "expense";
const PAGE = 20;

export function TransactionsView() {
  const { openEdit, version } = useTransactionSheet();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const [items, setItems] = useState<TxDTO[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totals, setTotals] = useState({ income: 0, expense: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const buildFilters = useCallback(
    (offset: number) => ({
      q: debounced || undefined,
      from: periodFromISO(period) ?? undefined,
      type: type === "all" ? undefined : type,
      limit: PAGE,
      offset,
    }),
    [debounced, period, type],
  );

  // Новая выборка при смене фильтров или после изменения данных (version).
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    getTransactions(buildFilters(0)).then((res) => {
      if (id !== reqId.current) return; // устаревший ответ
      if ("error" in res) {
        setError(res.error);
      } else {
        const page = res as TxPage;
        setItems(page.items);
        setHasMore(page.hasMore);
        setTotals(page.totals);
      }
      setLoading(false);
    });
  }, [buildFilters, version]);

  const loadMore = async () => {
    const id = reqId.current;
    setLoadingMore(true);
    const res = await getTransactions(buildFilters(items.length));
    if (id === reqId.current && !("error" in res)) {
      const page = res as TxPage;
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    }
    setLoadingMore(false);
  };

  const groups = useMemo(() => {
    const map = new Map<string, TxDTO[]>();
    for (const t of items) {
      const k = isoToLocalDate(t.occurredAt);
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Транзакции</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {totals.count} {pluralOps(totals.count)}
          </p>
        </div>
        <div className="hidden text-right text-sm sm:block">
          <div className="text-mint">
            +<Money amount={totals.income} />
          </div>
          <div className="text-text-secondary">
            −<Money amount={totals.expense} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по описанию или категории"
            aria-label="Поиск операций"
            className="h-10 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Segmented
            label="Период"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "all", label: "Всё время" },
              { value: "today", label: "Сегодня" },
              { value: "week", label: "Неделя" },
              { value: "month", label: "Месяц" },
            ]}
          />
          <Segmented
            label="Тип операции"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "Все" },
              { value: "income", label: "Доходы" },
              { value: "expense", label: "Расходы" },
            ]}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-expense/40 bg-expense/10 px-4 py-3 text-sm text-expense">
          {error}
        </p>
      ) : loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Загрузка">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="grid place-items-center rounded-md border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <SearchX className="size-8 text-text-muted" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium">
            {debounced || period !== "all" || type !== "all" ? "Ничего не найдено" : "Пока нет операций"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {debounced || period !== "all" || type !== "all"
              ? "Измените запрос или фильтры."
              : "Нажмите «+» в нижней панели, чтобы добавить первую."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, list]) => (
            <section key={date} className="rounded-md border border-border bg-card px-5 pt-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {dayHeading(date)}
              </h2>
              <ul className="divide-y divide-border">
                {list.map((t) => (
                  <TransactionRow key={t.id} tx={t} showCategory onSelect={openEdit} />
                ))}
              </ul>
            </section>
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 className="animate-spin" />} Показать ещё
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
