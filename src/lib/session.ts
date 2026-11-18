import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";

/** Текущий пользователь из БД или null. Серверный код всегда берёт userId отсюда, не от клиента. */
export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      currency: schema.users.currency,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return user ?? null;
}
