"use server";

import { compare, hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import {
  changePasswordSchema,
  currencySchema,
  nameSchema,
  toFieldErrors,
  type ActionResult,
} from "@/lib/validation";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const UNAUTH: ActionResult = { error: "Сессия истекла. Войдите снова." };

export async function updateName(input: unknown): Promise<ActionResult> {
  const id = await requireUserId();
  if (!id) return UNAUTH;
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: { name: parsed.error.issues[0].message } };
  await db.update(schema.users).set({ name: parsed.data, updatedAt: new Date() }).where(eq(schema.users.id, id));
  return { ok: true };
}

export async function updateCurrency(input: unknown): Promise<ActionResult> {
  const id = await requireUserId();
  if (!id) return UNAUTH;
  const parsed = currencySchema.safeParse(input);
  if (!parsed.success) return { error: "Неизвестная валюта" };
  await db.update(schema.users).set({ currency: parsed.data, updatedAt: new Date() }).where(eq(schema.users.id, id));
  return { ok: true };
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const id = await requireUserId();
  if (!id) return UNAUTH;
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const [user] = await db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  if (!user || !(await compare(parsed.data.current, user.passwordHash))) {
    return { fieldErrors: { current: "Неверный текущий пароль" } };
  }
  await db
    .update(schema.users)
    .set({ passwordHash: await hash(parsed.data.next, 10), updatedAt: new Date() })
    .where(eq(schema.users.id, id));
  return { ok: true };
}
