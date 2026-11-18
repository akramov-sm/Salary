// Проверка изоляции данных: пользователь B не должен видеть или менять данные пользователя A.
// Запуск: npm run db:check-isolation. Создаёт временных пользователей и удаляет их в конце.
import "./env";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "./index";
import * as q from "./queries";

let failures = 0;
function check(name: string, ok: boolean, details = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${!ok && details ? ` — ${details}` : ""}`);
  if (!ok) failures++;
}

const stamp = Date.now();

async function main() {
  const [a, b] = await db
    .insert(schema.users)
    .values([
      { name: "Isolation A", email: `iso-a-${stamp}@example.test`, passwordHash: "x" },
      { name: "Isolation B", email: `iso-b-${stamp}@example.test`, passwordHash: "x" },
    ])
    .returning();

  try {
    const defaults = await q.listCategories(a.id);
    const expenseCat = defaults.find((c) => c.type === "expense" && c.isDefault)!;
    const incomeCat = defaults.find((c) => c.type === "income" && c.isDefault)!;

    // Личная категория A
    const custom = await q.createCategory(a.id, { name: `Секрет ${stamp}`, type: "expense", icon: "Home", color: "#06D6A0" });
    check("A создаёт личную категорию", custom.ok);
    const customId = custom.ok ? custom.data.id : "";

    const bCats = await q.listCategories(b.id);
    check("B не видит личную категорию A", !bCats.some((c) => c.id === customId));
    check("B видит системные категории", bCats.some((c) => c.isDefault));

    const bUsesCustom = await q.createTransaction(b.id, {
      type: "expense", amount: 10, categoryId: customId, occurredAt: new Date().toISOString(), description: null,
    });
    check("B не может использовать категорию A в операции", !bUsesCustom.ok);

    // Операции A
    const t = await q.createTransaction(a.id, {
      type: "expense", amount: 123.45, categoryId: expenseCat.id, occurredAt: new Date().toISOString(), description: `секретная трата ${stamp}`,
    });
    check("A создаёт операцию", t.ok);
    const txId = t.ok ? t.data.id : "";

    const bList = await q.listTransactions(b.id, {});
    check("B не видит операции A в списке", bList.items.length === 0 && bList.totals.count === 0);
    const bSearch = await q.listTransactions(b.id, { q: "секретная" });
    check("B не находит операции A через поиск", bSearch.items.length === 0);
    const bRecent = await q.recentTransactions(b.id);
    check("B не видит операции A в «последних»", bRecent.length === 0);

    const upd = await q.updateTransaction(b.id, txId, {
      type: "expense", amount: 1, categoryId: expenseCat.id, occurredAt: new Date().toISOString(), description: "взлом",
    });
    check("B не может изменить операцию A", !upd.ok);
    const del = await q.deleteTransaction(b.id, txId);
    check("B не может удалить операцию A", !del.ok);

    const aAfter = await q.listTransactions(a.id, {});
    check(
      "Операция A осталась нетронутой",
      aAfter.items.length === 1 && aAfter.items[0].amount === 123.45 && aAfter.items[0].description === `секретная трата ${stamp}`,
    );

    const bStats = await q.computeStats(b.id, "UTC");
    const aStats = await q.computeStats(a.id, "UTC");
    check("Статистика B не включает данные A", bStats.balance === 0 && bStats.expense === 0);
    check("Статистика A считает свою операцию", aStats.balance === -123.45 && aStats.expense === 123.45);

    const bTotals = await q.categoryTotals(b.id);
    check("Итоги по категориям B пусты", Object.keys(bTotals).length === 0);

    // Валидация сервисов
    const wrongType = await q.createTransaction(a.id, {
      type: "income", amount: 5, categoryId: expenseCat.id, occurredAt: new Date().toISOString(), description: null,
    });
    check("Тип операции должен совпадать с типом категории", !wrongType.ok);
    const future = await q.createTransaction(a.id, {
      type: "income", amount: 5, categoryId: incomeCat.id, occurredAt: new Date(Date.now() + 5 * 86400000).toISOString(), description: null,
    });
    check("Будущая дата отклоняется", !future.ok);
    const dupCat = await q.createCategory(a.id, { name: custom.ok ? custom.data.name.toLowerCase() : "", type: "expense", icon: "Home", color: "#06D6A0" });
    check("Дубликат категории отклоняется", !dupCat.ok);
    const badIcon = await q.createCategory(a.id, { name: "Нет такой", type: "expense", icon: "Evil", color: "#06D6A0" });
    check("Неизвестная иконка отклоняется", !badIcon.ok);
  } finally {
    const ids = [a.id, b.id];
    await db.delete(schema.transactions).where(inArray(schema.transactions.userId, ids));
    await db.delete(schema.categories).where(inArray(schema.categories.userId, ids));
    await db.delete(schema.users).where(inArray(schema.users.id, ids));
    const left = await db.select().from(schema.users).where(eq(schema.users.id, a.id));
    check("Тестовые данные удалены", left.length === 0);
  }

  console.log(failures === 0 ? "\nИзоляция данных: OK" : `\nПровалено проверок: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
