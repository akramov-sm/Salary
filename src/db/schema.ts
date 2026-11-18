import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  currency: text("currency").default("RUB").notNull(), // RUB, USD, EUR, KZT, UZS
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    // null = системная категория, общая для всех пользователей
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    icon: text("icon").default("CircleDollarSign").notNull(), // имя иконки Lucide
    color: text("color").default("#06D6A0").notNull(), // HEX цвета метки
    isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  },
  (t) => [index("categories_user_idx").on(t.userId)],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: text("category_id")
      .references(() => categories.id, { onDelete: "restrict" })
      .notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    amount: real("amount").notNull(), // всегда положительная; знак задаёт type
    date: integer("date", { mode: "timestamp" }).notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  },
  (t) => [
    index("transactions_user_date_idx").on(t.userId, t.date),
    index("transactions_category_idx").on(t.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
