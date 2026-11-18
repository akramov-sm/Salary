import "./env";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";

// Стабильные id совпадают с id, на которые ссылаются остальные части приложения,
// чтобы повторный запуск seed не менял ссылки.
const DEFAULTS: { id: string; name: string; type: "income" | "expense"; icon: string; color: string }[] = [
  { id: "e-food", name: "Продукты", type: "expense", icon: "ShoppingBasket", color: "#06D6A0" },
  { id: "e-home", name: "Жильё", type: "expense", icon: "Home", color: "#00BBF9" },
  { id: "e-transport", name: "Транспорт", type: "expense", icon: "Bus", color: "#A78BFA" },
  { id: "e-cafe", name: "Кафе", type: "expense", icon: "Coffee", color: "#F59E0B" },
  { id: "e-phone", name: "Связь", type: "expense", icon: "Smartphone", color: "#94A3B8" },
  { id: "e-health", name: "Здоровье", type: "expense", icon: "HeartPulse", color: "#F43F5E" },
  { id: "e-fun", name: "Развлечения", type: "expense", icon: "Clapperboard", color: "#A78BFA" },
  { id: "e-clothes", name: "Одежда", type: "expense", icon: "Shirt", color: "#00BBF9" },
  { id: "i-salary", name: "Зарплата", type: "income", icon: "Banknote", color: "#06D6A0" },
  { id: "i-freelance", name: "Фриланс", type: "income", icon: "Laptop", color: "#00BBF9" },
  { id: "i-invest", name: "Инвестиции", type: "income", icon: "TrendingUp", color: "#F59E0B" },
  { id: "i-gift", name: "Подарки", type: "income", icon: "Gift", color: "#A78BFA" },
];

async function main() {
  // Идемпотентно: повторный запуск не создаёт дубликаты.
  await db
    .insert(schema.categories)
    .values(DEFAULTS.map((c) => ({ ...c, userId: null, isDefault: true })))
    .onConflictDoNothing();

  const rows = await db
    .select({ id: schema.categories.id, name: schema.categories.name, type: schema.categories.type })
    .from(schema.categories)
    .where(eq(schema.categories.isDefault, true));
  console.log(`Системных категорий в базе: ${rows.length}`);
  for (const r of rows) console.log(` - [${r.type}] ${r.name}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
