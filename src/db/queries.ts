// Слой доступа к данным. КАЖДАЯ функция принимает userId и обязательно
// добавляет eq(userId) в условия — изоляция данных между пользователями (SPEC §5).
// userId всегда берётся из серверной сессии, а не из ввода клиента.
import { and, desc, eq, gte, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "./index";
import { ICON_NAMES } from "@/lib/icons";
import { addDays, dayKey, startOfDay, startOfMonth } from "@/lib/tz";
import type { CategoryDTO, DashboardStats, TxDTO, TxFilters, TxPage } from "@/lib/types";
import type { CategoryInput, TxInput } from "@/lib/validation";

const { transactions: tx, categories: cat } = schema;

const r2 = (n: number) => Math.round(n * 100) / 100;

const toTxDTO = (r: typeof tx.$inferSelect): TxDTO => ({
  id: r.id,
  categoryId: r.categoryId,
  type: r.type,
  amount: r.amount,
  occurredAt: r.date.toISOString(),
  description: r.description,
});

const toCategoryDTO = (r: typeof cat.$inferSelect): CategoryDTO => ({
  id: r.id,
  name: r.name,
  type: r.type,
  icon: r.icon,
  color: r.color,
  isDefault: r.isDefault,
});

export type ServiceResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; field?: string };

// ---------------------------------------------------------------- Категории

/** Системные + личные категории пользователя. */
export async function listCategories(userId: string): Promise<CategoryDTO[]> {
  const rows = await db
    .select()
    .from(cat)
    .where(or(isNull(cat.userId), eq(cat.userId, userId)))
    .orderBy(desc(cat.isDefault), cat.createdAt, cat.name);
  return rows.map(toCategoryDTO);
}

export async function createCategory(
  userId: string,
  input: CategoryInput,
): Promise<ServiceResult<CategoryDTO>> {
  if (!ICON_NAMES.includes(input.icon)) return { ok: false, error: "Неизвестная иконка", field: "icon" };

  const visible = await listCategories(userId);
  const dup = visible.some(
    (c) => c.type === input.type && c.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (dup) return { ok: false, error: "Такая категория уже есть", field: "name" };

  const [row] = await db
    .insert(cat)
    .values({ userId, name: input.name, type: input.type, icon: input.icon, color: input.color, isDefault: false })
    .returning();
  return { ok: true, data: toCategoryDTO(row) };
}

/** Количество и сумма операций пользователя по каждой категории. */
export async function categoryTotals(userId: string) {
  const rows = await db
    .select({
      categoryId: tx.categoryId,
      total: sql<number>`coalesce(sum(${tx.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(tx)
    .where(eq(tx.userId, userId))
    .groupBy(tx.categoryId);
  return Object.fromEntries(
    rows.map((r) => [r.categoryId, { total: r2(Number(r.total)), count: Number(r.count) }]),
  ) as Record<string, { total: number; count: number }>;
}

// -------------------------------------------------------------- Транзакции

/** Категория должна быть системной или принадлежать пользователю и совпадать по типу. */
async function usableCategory(userId: string, categoryId: string, type: TxInput["type"]) {
  const [row] = await db
    .select({ id: cat.id })
    .from(cat)
    .where(and(eq(cat.id, categoryId), eq(cat.type, type), or(isNull(cat.userId), eq(cat.userId, userId))))
    .limit(1);
  return !!row;
}

function validDate(iso: string) {
  const t = new Date(iso).getTime();
  // допускаем сутки запаса из-за часовых поясов; будущие операции не принимаем
  return Number.isFinite(t) && t <= Date.now() + 24 * 3600 * 1000;
}

export async function createTransaction(userId: string, input: TxInput): Promise<ServiceResult<TxDTO>> {
  if (!validDate(input.occurredAt)) return { ok: false, error: "Дата не может быть в будущем", field: "date" };
  if (!(await usableCategory(userId, input.categoryId, input.type))) {
    return { ok: false, error: "Категория недоступна", field: "category" };
  }
  const [row] = await db
    .insert(tx)
    .values({
      userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      date: new Date(input.occurredAt),
      description: input.description,
    })
    .returning();
  return { ok: true, data: toTxDTO(row) };
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TxInput,
): Promise<ServiceResult<TxDTO>> {
  if (!validDate(input.occurredAt)) return { ok: false, error: "Дата не может быть в будущем", field: "date" };
  if (!(await usableCategory(userId, input.categoryId, input.type))) {
    return { ok: false, error: "Категория недоступна", field: "category" };
  }
  const rows = await db
    .update(tx)
    .set({
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      date: new Date(input.occurredAt),
      description: input.description,
      updatedAt: new Date(),
    })
    .where(and(eq(tx.id, id), eq(tx.userId, userId))) // чужую запись изменить нельзя
    .returning();
  if (rows.length === 0) return { ok: false, error: "Операция не найдена" };
  return { ok: true, data: toTxDTO(rows[0]) };
}

export async function deleteTransaction(userId: string, id: string): Promise<ServiceResult> {
  const rows = await db
    .delete(tx)
    .where(and(eq(tx.id, id), eq(tx.userId, userId)))
    .returning({ id: tx.id });
  if (rows.length === 0) return { ok: false, error: "Операция не найдена" };
  return { ok: true };
}

const MAX_SEARCH_ROWS = 5000;

/**
 * Страница операций с фильтрами. Текстовый поиск выполняется в JS: LIKE в SQLite
 * не различает регистр только для ASCII, а у нас кириллица.
 */
export async function listTransactions(userId: string, f: TxFilters): Promise<TxPage> {
  const limit = f.limit ?? 20;
  const offset = f.offset ?? 0;

  const where: SQL[] = [eq(tx.userId, userId)];
  if (f.from) where.push(gte(tx.date, new Date(f.from)));
  if (f.to) where.push(lt(tx.date, new Date(f.to)));
  if (f.type) where.push(eq(tx.type, f.type));
  if (f.categoryId) where.push(eq(tx.categoryId, f.categoryId));
  const cond = and(...where);

  const q = f.q?.trim().toLowerCase();
  if (q) {
    const rows = await db
      .select({ t: tx, catName: cat.name })
      .from(tx)
      .innerJoin(cat, eq(cat.id, tx.categoryId))
      .where(cond)
      .orderBy(desc(tx.date), desc(tx.createdAt))
      .limit(MAX_SEARCH_ROWS);
    const hits = rows.filter(
      ({ t, catName }) =>
        (t.description ?? "").toLowerCase().includes(q) || catName.toLowerCase().includes(q),
    );
    let income = 0;
    let expense = 0;
    for (const { t } of hits) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return {
      items: hits.slice(offset, offset + limit).map(({ t }) => toTxDTO(t)),
      hasMore: hits.length > offset + limit,
      totals: { income: r2(income), expense: r2(expense), count: hits.length },
    };
  }

  const [rows, agg] = await Promise.all([
    db
      .select()
      .from(tx)
      .where(cond)
      .orderBy(desc(tx.date), desc(tx.createdAt))
      .limit(limit + 1)
      .offset(offset),
    db
      .select({
        type: tx.type,
        total: sql<number>`coalesce(sum(${tx.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(tx)
      .where(cond)
      .groupBy(tx.type),
  ]);
  const totals = { income: 0, expense: 0, count: 0 };
  for (const a of agg) {
    totals[a.type] = r2(Number(a.total));
    totals.count += Number(a.count);
  }
  return { items: rows.slice(0, limit).map(toTxDTO), hasMore: rows.length > limit, totals };
}

export async function recentTransactions(userId: string, n = 5): Promise<TxDTO[]> {
  const rows = await db
    .select()
    .from(tx)
    .where(eq(tx.userId, userId))
    .orderBy(desc(tx.date), desc(tx.createdAt))
    .limit(n);
  return rows.map(toTxDTO);
}

// ---------------------------------------------------------------- Статистика

const pct = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;

/** Метрики дашборда и аналитики, посчитанные в часовом поясе пользователя. */
export async function computeStats(
  userId: string,
  tz: string,
  now = new Date(),
): Promise<DashboardStats> {
  const today0 = startOfDay(tz, now);
  const dayStarts = Array.from({ length: 30 }, (_, i) => addDays(tz, today0, i - 29));
  const monthStart = startOfMonth(tz, now);
  const prevMonthStart = startOfMonth(tz, addDays(tz, monthStart, -1));
  const from = new Date(Math.min(prevMonthStart.getTime(), dayStarts[0].getTime()));

  const [totals, rows] = await Promise.all([
    db
      .select({ type: tx.type, total: sql<number>`coalesce(sum(${tx.amount}), 0)` })
      .from(tx)
      .where(eq(tx.userId, userId))
      .groupBy(tx.type),
    db
      .select({ type: tx.type, amount: tx.amount, date: tx.date, categoryId: tx.categoryId })
      .from(tx)
      .where(and(eq(tx.userId, userId), gte(tx.date, from))),
  ]);

  let allIncome = 0;
  let allExpense = 0;
  for (const t of totals) {
    if (t.type === "income") allIncome = Number(t.total);
    else allExpense = Number(t.total);
  }
  const balance = allIncome - allExpense;

  const idx = new Map(dayStarts.map((d, i) => [dayKey(tz, d), i]));
  const dailyIncome = Array(30).fill(0) as number[];
  const dailyExpense = Array(30).fill(0) as number[];
  const monthStartMs = monthStart.getTime();
  const prevMonthStartMs = prevMonthStart.getTime();
  let monthIncome = 0;
  let monthExpense = 0;
  let prevIncome = 0;
  let prevExpense = 0;
  const byCat = new Map<string, number>();
  const series7 = new Map<string, number[]>();
  const series14: Record<string, number[]> = {};

  for (const r of rows) {
    const ts = r.date.getTime();
    const i = idx.get(dayKey(tz, r.date));
    if (i !== undefined) {
      if (r.type === "income") dailyIncome[i] += r.amount;
      else dailyExpense[i] += r.amount;
      if (i >= 16) {
        const s = (series14[r.categoryId] ??= Array(14).fill(0));
        s[i - 16] += r.amount;
      }
      if (r.type === "expense" && i >= 23) {
        const s = series7.get(r.categoryId) ?? (Array(7).fill(0) as number[]);
        s[i - 23] += r.amount;
        series7.set(r.categoryId, s);
      }
    }
    if (ts >= monthStartMs) {
      if (r.type === "income") monthIncome += r.amount;
      else {
        monthExpense += r.amount;
        byCat.set(r.categoryId, (byCat.get(r.categoryId) ?? 0) + r.amount);
      }
    } else if (ts >= prevMonthStartMs) {
      if (r.type === "income") prevIncome += r.amount;
      else prevExpense += r.amount;
    }
  }

  // Баланс на конец каждого дня: идём назад от текущего.
  const balanceTrend = Array(30).fill(0) as number[];
  balanceTrend[29] = balance;
  for (let i = 28; i >= 0; i--) {
    balanceTrend[i] = balanceTrend[i + 1] - (dailyIncome[i + 1] - dailyExpense[i + 1]);
  }

  const net = monthIncome - monthExpense;
  const startBalance = balance - net;
  const monthCategories = [...byCat.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount: r2(amount),
      series: (series7.get(categoryId) ?? (Array(7).fill(0) as number[])).map(r2),
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    balance: r2(balance),
    // Процент от нулевой или отрицательной базы не имеет смысла — тогда динамику не показываем.
    balanceChangePct: startBalance > 0 ? Math.round((net / startBalance) * 1000) / 10 : null,
    income: r2(monthIncome),
    incomeChangePct: pct(monthIncome, prevIncome),
    expense: r2(monthExpense),
    expenseChangePct: pct(monthExpense, prevExpense),
    balanceTrend: balanceTrend.map(r2),
    incomeTrend: dailyIncome.slice(-14).map(r2),
    expenseTrend: dailyExpense.slice(-14).map(r2),
    dailyIncome: dailyIncome.map(r2),
    dailyExpense: dailyExpense.map(r2),
    monthCategories,
    catSeries14: Object.fromEntries(Object.entries(series14).map(([k, v]) => [k, v.map(r2)])),
    avgDailyExpense: r2(dailyExpense.reduce((s, v) => s + v, 0) / 30),
    savingsRate: monthIncome > 0 ? Math.round((net / monthIncome) * 100) : null,
  };
}
