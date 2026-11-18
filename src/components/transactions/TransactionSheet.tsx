"use client";

import { useRef, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useCategories,
  useSettings,
  useTransactionSheet,
} from "@/components/providers/AppProviders";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/actions/transaction.actions";
import { CURRENCIES } from "@/lib/currency";
import {
  daysAgoISO,
  isoToClock,
  isoToLocalDate,
  localToISO,
  nowClock,
  todayISO,
} from "@/lib/date";
import type { TxDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "expense" | "income";

/** «1500» → «1 500», «1500,5» → «1 500,5» (до 2 знаков после запятой). */
function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(".", ",");
  const [intPart, ...rest] = cleaned.split(",");
  const dec = rest.join("").slice(0, 2);
  const digits = intPart.replace(/^0+(?=\d)/, "").slice(0, 12);
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return cleaned.includes(",") ? `${grouped || "0"},${dec}` : grouped;
}

function parseAmount(formatted: string): number {
  return Number(formatted.replace(/ /g, "").replace(",", "."));
}

function formatForInput(n: number): string {
  return formatAmountInput(String(n).replace(".", ","));
}

export function TransactionSheet() {
  const { open, editing, close } = useTransactionSheet();
  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="text-lg">{editing ? "Редактирование" : "Новая операция"}</SheetTitle>
          <SheetDescription>
            {editing ? "Измените данные или удалите операцию." : "Добавьте доход или расход за пару секунд."}
          </SheetDescription>
        </SheetHeader>
        {/* Форма монтируется только при открытой шторке — состояние сбрасывается само. */}
        <TransactionForm key={editing?.id ?? "new"} editing={editing} />
      </SheetContent>
    </Sheet>
  );
}

function TransactionForm({ editing }: { editing: TxDTO | null }) {
  const { close, bump } = useTransactionSheet();
  const { categories } = useCategories();
  const { currency } = useSettings();
  const today = todayISO();
  const yesterday = daysAgoISO(1);

  const [kind, setKind] = useState<Kind>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing ? formatForInput(editing.amount) : "");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [date, setDate] = useState(editing ? isoToLocalDate(editing.occurredAt) : today);
  const [note, setNote] = useState(editing?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const clockRef = useRef(editing ? isoToClock(editing.occurredAt) : nowClock());

  const options = categories.filter((c) => c.type === kind);
  const selected = categories.find((c) => c.id === categoryId) ?? null;
  const value = parseAmount(amount);

  const amountError = !(value > 0)
    ? "Введите сумму больше нуля"
    : value > 1_000_000_000
      ? "Слишком большая сумма"
      : null;
  const categoryError = selected ? null : "Выберите категорию";
  const dateError = !date || date > today ? "Дата не может быть в будущем" : null;

  const changeKind = (k: Kind) => {
    setKind(k);
    if (selected && selected.type !== k) setCategoryId(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (amountError || categoryError || dateError || !selected) return;

    const payload = {
      type: kind,
      amount: value,
      categoryId: selected.id,
      occurredAt: localToISO(date, clockRef.current),
      description: note.trim() || undefined,
    };
    startTransition(async () => {
      const res = editing ? await updateTransaction(editing.id, payload) : await createTransaction(payload);
      if (res.ok) {
        toast.success(editing ? "Операция обновлена" : "Операция сохранена");
        bump();
        close();
      } else {
        const msg = res.error ?? Object.values(res.fieldErrors ?? {})[0] ?? "Не удалось сохранить";
        setServerError(msg);
        toast.error(msg);
      }
    });
  };

  const remove = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await deleteTransaction(editing.id);
      if (res.ok) {
        toast.success("Операция удалена");
        bump();
        close();
      } else {
        toast.error(res.error ?? "Не удалось удалить");
        setConfirmDelete(false);
      }
    });
  };

  const income = kind === "income";

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
      <Tabs value={kind} onValueChange={(v) => changeKind(v as Kind)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense" className="data-active:text-expense">
            Расход
          </TabsTrigger>
          <TabsTrigger value="income" className="data-active:text-mint">
            Доход
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div>
        <label htmlFor="tx-amount" className="text-xs text-text-secondary">
          Сумма
        </label>
        <div className="mt-1 flex items-baseline gap-2 border-b border-border pb-2 focus-within:border-ring">
          <input
            id="tx-amount"
            autoFocus={!editing}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            aria-invalid={submitted && !!amountError}
            className={cn(
              "money w-full bg-transparent text-4xl font-semibold outline-none placeholder:text-text-muted",
              income ? "text-mint" : "text-foreground",
            )}
          />
          <span className="text-2xl text-text-secondary">{CURRENCIES[currency].symbol}</span>
        </div>
        {submitted && amountError && <p className="mt-1 text-xs text-expense">{amountError}</p>}
      </div>

      <div>
        <span className="text-xs text-text-secondary">Категория</span>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={pickerOpen}
              aria-invalid={submitted && !!categoryError}
              className="mt-1 h-10 w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2">
                {selected ? (
                  <>
                    <selected.icon className="size-4 text-text-secondary" strokeWidth={1.5} />
                    {selected.name}
                  </>
                ) : (
                  <span className="text-text-muted">Выберите категорию</span>
                )}
              </span>
              <ChevronsUpDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
            <Command>
              <CommandInput placeholder="Поиск категории…" />
              <CommandList>
                <CommandEmpty>Ничего не найдено</CommandEmpty>
                <CommandGroup>
                  {options.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => {
                        setCategoryId(c.id);
                        setPickerOpen(false);
                      }}
                    >
                      <c.icon className="size-4 text-text-secondary" strokeWidth={1.5} />
                      {c.name}
                      {c.id === categoryId && <Check className="ml-auto size-4 text-mint" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {submitted && categoryError && <p className="mt-1 text-xs text-expense">{categoryError}</p>}
      </div>

      <div>
        <label htmlFor="tx-date" className="text-xs text-text-secondary">
          Дата
        </label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            id="tx-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={submitted && !!dateError}
            className="money h-10 flex-1 scheme-dark"
          />
          <Button
            type="button"
            variant={date === today ? "secondary" : "outline"}
            onClick={() => setDate(today)}
          >
            Сегодня
          </Button>
          <Button
            type="button"
            variant={date === yesterday ? "secondary" : "outline"}
            onClick={() => setDate(yesterday)}
          >
            Вчера
          </Button>
        </div>
        {submitted && dateError && <p className="mt-1 text-xs text-expense">{dateError}</p>}
      </div>

      <div>
        <label htmlFor="tx-note" className="text-xs text-text-secondary">
          Заметка <span className="text-text-muted">(необязательно)</span>
        </label>
        <Input
          id="tx-note"
          maxLength={120}
          placeholder="Например, кофе с коллегами"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 h-10"
        />
      </div>

      {serverError && (
        <p role="alert" className="rounded-md border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
          {serverError}
        </p>
      )}

      <div className="mt-auto space-y-2">
        <Button type="submit" size="lg" disabled={pending} className="h-11 w-full">
          {pending ? (
            <>
              <Loader2 className="animate-spin" /> Сохраняем…
            </>
          ) : editing ? (
            "Сохранить изменения"
          ) : (
            "Сохранить операцию"
          )}
        </Button>

        {editing &&
          (confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="destructive" disabled={pending} onClick={remove} className="h-10 flex-1">
                Да, удалить
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirmDelete(false)} className="h-10 flex-1">
                Отмена
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmDelete(true)}
              className="h-10 w-full text-expense hover:text-expense"
            >
              <Trash2 /> Удалить операцию
            </Button>
          ))}
      </div>
    </form>
  );
}
