"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { loginAction, registerAction } from "@/actions/auth.actions";
import { loginSchema, registerSchema, toFieldErrors } from "@/lib/validation";

type Mode = "login" | "register";
type Values = { name: string; email: string; password: string; confirm: string };
type Errors = Partial<Record<keyof Values, string>>;

export function AuthForm({ mode }: { mode: Mode }) {
  const register = mode === "register";
  const [values, setValues] = useState<Values>({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const change = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = (register ? registerSchema : loginSchema).safeParse(values);
    if (!result.success) {
      setErrors(toFieldErrors(result.error) as Errors);
      return;
    }
    setFormError(null);
    startTransition(async () => {
      // При успехе действие делает redirect на "/", сюда управление не возвращается.
      const res = await (register ? registerAction(values) : loginAction(values));
      if (res.fieldErrors) setErrors(res.fieldErrors as Errors);
      if (res.error) setFormError(res.error);
    });
  };

  const field = (
    k: keyof Values,
    label: string,
    props: React.ComponentProps<"input"> = {},
  ) => (
    <div>
      <label htmlFor={`auth-${k}`} className="text-xs text-text-secondary">
        {label}
      </label>
      <Input
        id={`auth-${k}`}
        value={values[k]}
        onChange={change(k)}
        aria-invalid={!!errors[k]}
        className="mt-1 h-10"
        {...props}
      />
      {errors[k] && <p className="mt-1 text-xs text-expense">{errors[k]}</p>}
    </div>
  );

  const pwType = show ? "text" : "password";

  return (
    <div className="rounded-md border border-border bg-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">
        {register ? "Создать аккаунт" : "Вход в Salary"}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {register ? "Начните вести учёт за минуту." : "Рады видеть вас снова."}
      </p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {register && field("name", "Имя", { autoComplete: "name", autoFocus: true })}
        {field("email", "Email", {
          type: "email",
          autoComplete: "email",
          autoFocus: !register,
          placeholder: "you@example.com",
        })}
        <div className="relative">
          {field("password", "Пароль", {
            type: pwType,
            autoComplete: register ? "new-password" : "current-password",
          })}
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-2 top-[26px] grid size-8 place-items-center rounded-md text-text-muted hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
          </button>
        </div>
        {register &&
          field("confirm", "Повторите пароль", { type: pwType, autoComplete: "new-password" })}

        {formError && (
          <p role="alert" className="rounded-md border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="h-11 w-full">
          {loading ? <Loader2 className="animate-spin" /> : register ? "Зарегистрироваться" : "Войти"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {register ? (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-mint hover:underline">
              Войти
            </Link>
          </>
        ) : (
          <>
            Нет аккаунта?{" "}
            <Link href="/register" className="text-mint hover:underline">
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
