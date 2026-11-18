"use server";

import { AuthError } from "next-auth";
import { hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { signIn, signOut } from "@/lib/auth";
import {
  loginSchema,
  registerSchema,
  toFieldErrors,
  type ActionResult,
} from "@/lib/validation";

async function startSession(email: string, password: string): Promise<ActionResult> {
  try {
    // При успехе signIn бросает NEXT_REDIRECT — он должен пройти наружу.
    await signIn("credentials", { email, password, redirectTo: "/" });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { error: "Неверный email или пароль" };
    throw e;
  }
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing) return { fieldErrors: { email: "Этот email уже зарегистрирован" } };

  try {
    await db.insert(schema.users).values({ name, email, passwordHash: await hash(password, 10) });
  } catch {
    // гонка: email успели занять между проверкой и записью (UNIQUE)
    return { fieldErrors: { email: "Этот email уже зарегистрирован" } };
  }
  return startSession(email, password);
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  return startSession(parsed.data.email, parsed.data.password);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
