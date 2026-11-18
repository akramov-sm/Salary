/** DTO, которые сервер отдаёт клиенту (только простые сериализуемые поля). */

export type TxType = "income" | "expense";

export type TxDTO = {
  id: string;
  categoryId: string;
  type: TxType;
  /** Всегда положительная; знак задаёт type. */
  amount: number;
  /** Момент операции, ISO-строка в UTC. Локальную дату/время считает клиент. */
  occurredAt: string;
  description: string | null;
};

export type CategoryDTO = {
  id: string;
  name: string;
  type: TxType;
  /** Имя иконки Lucide (см. src/lib/icons.ts). */
  icon: string;
  color: string;
  isDefault: boolean;
};

export type TxFilters = {
  q?: string;
  /** ISO-момент, включительно */
  from?: string;
  /** ISO-момент, не включительно */
  to?: string;
  type?: TxType;
  categoryId?: string;
  limit?: number;
  offset?: number;
};

export type TxPage = {
  items: TxDTO[];
  hasMore: boolean;
  totals: { income: number; expense: number; count: number };
};

export type DashboardStats = {
  balance: number;
  balanceChangePct: number | null;
  income: number;
  incomeChangePct: number | null;
  expense: number;
  expenseChangePct: number | null;
  /** Баланс на конец каждого из последних 30 дней. */
  balanceTrend: number[];
  incomeTrend: number[];
  expenseTrend: number[];
  dailyIncome: number[];
  dailyExpense: number[];
  /** Расходы текущего месяца по категориям, от больших к меньшим. */
  monthCategories: { categoryId: string; amount: number; series: number[] }[];
  /** Сумма (по модулю) по дням за последние 14 дней — для карточек категорий. */
  catSeries14: Record<string, number[]>;
  avgDailyExpense: number;
  savingsRate: number | null;
};
