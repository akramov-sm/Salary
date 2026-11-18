import { z } from "zod";
import { CURRENCIES } from "./currency";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Введите email")
  .max(254, "Слишком длинный email")
  .email("Некорректный email");

export const nameSchema = z.string().trim().min(2, "Минимум 2 символа").max(40, "Не длиннее 40 символов");

export const newPasswordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(72, "Не длиннее 72 символов") // ограничение bcrypt
  .refine((v) => /[A-Za-zА-Яа-яЁё]/.test(v) && /\d/.test(v), { message: "Нужны буквы и цифры" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль").max(72),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Пароли не совпадают" });

export const currencySchema = z.enum(Object.keys(CURRENCIES) as [keyof typeof CURRENCIES]);

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Введите текущий пароль").max(72),
    next: newPasswordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Пароли не совпадают" });

/** Результат Server Action: ошибки по полям или общая ошибка. */
export type ActionResult = {
  ok?: true;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// ---------- Транзакции и категории ----------

const HEX = /^#[0-9A-Fa-f]{6}$/;

export const txInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z
    .number({ message: "Введите сумму" })
    .positive("Сумма должна быть больше нуля")
    .max(1_000_000_000, "Слишком большая сумма")
    .transform((n) => Math.round(n * 100) / 100),
  categoryId: z.string().min(1, "Выберите категорию").max(64),
  /** ISO-момент операции */
  occurredAt: z.string().datetime({ message: "Некорректная дата" }),
  description: z
    .string()
    .trim()
    .max(120, "Не длиннее 120 символов")
    .optional()
    .transform((v) => (v ? v : null)),
});
export type TxInput = z.infer<typeof txInputSchema>;

export const txFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().max(64).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).max(100_000).optional(),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(24, "Не длиннее 24 символов"),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1).max(40),
  color: z.string().regex(HEX, "Некорректный цвет"),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;
