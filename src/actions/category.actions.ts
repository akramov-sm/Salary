"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as q from "@/db/queries";
import { categoryInputSchema, toFieldErrors, type ActionResult } from "@/lib/validation";

export async function createCategory(input: unknown): Promise<ActionResult> {
  const userId = (await auth())?.user?.id;
  if (!userId) return { error: "Сессия истекла. Войдите снова." };
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const r = await q.createCategory(userId, parsed.data);
  if (!r.ok) return { error: r.error, fieldErrors: r.field ? { [r.field]: r.error } : undefined };
  revalidatePath("/", "layout");
  return { ok: true };
}
