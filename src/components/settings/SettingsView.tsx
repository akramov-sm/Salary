"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { useSettings } from "@/components/providers/AppProviders";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import type { ActionResult } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { changePasswordSchema, nameSchema, toFieldErrors } from "@/lib/validation";
import { changePassword } from "@/actions/user.actions";

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  RUB: "Российский рубль",
  USD: "Доллар США",
  EUR: "Евро",
  KZT: "Казахстанский тенге",
  UZS: "Узбекский сум",
};

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5 sm:p-6">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const { currency, setCurrency, name, email, saveName } = useSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Настройки</h1>
        <p className="mt-1 text-sm text-text-secondary">Профиль и базовая валюта</p>
      </div>

      <Card title="Базовая валюта" description="Символ валюты во всех суммах приложения.">
        <div role="radiogroup" aria-label="Валюта" className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
            const active = code === currency;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCurrency(code)}
                className={cn(
                  "flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
                  active && "border-mint bg-accent",
                )}
              >
                <span className="grid size-9 place-items-center rounded-md border border-border bg-secondary text-sm font-semibold">
                  {CURRENCIES[code].symbol}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{code}</span>
                  <span className="block text-xs text-text-secondary">{CURRENCY_LABELS[code]}</span>
                </span>
                {active && <Check className="size-4 text-mint" />}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Пример: <Money amount={1842500} />
        </p>
      </Card>

      <ProfileCard name={name} email={email} onSave={saveName} />
      <PasswordCard />
    </div>
  );
}

function ProfileCard({
  name,
  email,
  onSave,
}: {
  name: string;
  email: string;
  onSave: (n: string) => Promise<ActionResult>;
}) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = nameSchema.safeParse(value);
    if (!r.success) {
      setError(r.error.issues[0].message);
      setSaved(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await onSave(r.data);
      if (res.ok) setSaved(true);
      else setError(res.fieldErrors?.name ?? res.error ?? "Не удалось сохранить");
    });
  };

  return (
    <Card title="Профиль" description="Имя отображается в меню профиля.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="profile-name" className="text-xs text-text-secondary">
            Имя
          </label>
          <Input
            id="profile-name"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            aria-invalid={!!error}
            placeholder="Как к вам обращаться"
            className="mt-1 h-10"
          />
          {error && <p className="mt-1 text-xs text-expense">{error}</p>}
        </div>
        <div>
          <label htmlFor="profile-email" className="text-xs text-text-secondary">
            Email
          </label>
          <Input
            id="profile-email"
            value={email}
            disabled
            readOnly
            className="mt-1 h-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            Сохранить
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-mint">
              <Check className="size-4" /> Сохранено
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = changePasswordSchema.safeParse(form);
    if (!r.success) {
      setErrors(toFieldErrors(r.error) as typeof errors);
      setSaved(false);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await changePassword(form);
      if (res.ok) {
        setForm({ current: "", next: "", confirm: "" });
        setSaved(true);
      } else {
        setErrors((res.fieldErrors ?? { current: res.error ?? "Не удалось сменить пароль" }) as typeof errors);
      }
    });
  };

  const field = (k: keyof typeof form, label: string) => (
    <div>
      <label htmlFor={`pw-${k}`} className="text-xs text-text-secondary">
        {label}
      </label>
      <Input
        id={`pw-${k}`}
        type="password"
        autoComplete={k === "current" ? "current-password" : "new-password"}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
        className="mt-1 h-10"
      />
      {errors[k] && <p className="mt-1 text-xs text-expense">{errors[k]}</p>}
    </div>
  );

  return (
    <Card title="Пароль" description="Минимум 8 символов.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {field("current", "Текущий пароль")}
        {field("next", "Новый пароль")}
        {field("confirm", "Повторите новый пароль")}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" disabled={pending}>
            Сменить пароль
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-mint">
              <Check className="size-4" /> Готово
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
