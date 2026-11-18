"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as q from "@/db/queries";
import { toFieldErrors, txFiltersSchema, txInputSchema, type ActionResult } from "@/lib/validation";
import type { TxDTO, TxPage } from "@/lib/types";

async function userId(): Promise<string | null> {
  return (await auth())?.user?.id ?? null;
}

const UNAUTH = { error: "Сессия истекла. Войдите снова." } as const;

export type TxResult = ActionResult & { tx?: TxDTO };

export async function getTransactions(input: unknown): Promise<TxPage | { error: string }> {
  const id = await userId();
  if (!id) return UNAUTH;
  const parsed = txFiltersSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректные фильтры" };
  return q.listTransactions(id, parsed.data);
}

function fromService(r: Awaited<ReturnType<typeof q.createTransaction>>): TxResult {
  if (r.ok) return { ok: true, tx: r.data };
  return { error: r.error, fieldErrors: r.field ? { [r.field]: r.error } : undefined };
}

export async function createTransaction(input: unknown): Promise<TxResult> {
  const id = await userId();
  if (!id) return UNAUTH;
  const parsed = txInputSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const res = fromService(await q.createTransaction(id, parsed.data));
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

export async function updateTransaction(txId: unknown, input: unknown): Promise<TxResult> {
  const id = await userId();
  if (!id) return UNAUTH;
  if (typeof txId !== "string" || txId.length > 64) return { error: "Операция не найдена" };
  const parsed = txInputSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const res = fromService(await q.updateTransaction(id, txId, parsed.data));
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

export async function deleteTransaction(txId: unknown): Promise<ActionResult> {
  const id = await userId();
  if (!id) return UNAUTH;
  if (typeof txId !== "string" || txId.length > 64) return { error: "Операция не найдена" };
  const r = await q.deleteTransaction(id, txId);
  if (!r.ok) return { error: r.error };
  revalidatePath("/", "layout");
  return { ok: true };
}
