"use client";

import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { usePrivacy, useSettings } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";

/** Сумма с tabular-nums; валюта берётся из настроек; в режиме приватности — «••••••». */
export function Money({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency?: CurrencyCode;
  className?: string;
}) {
  const { hidden } = usePrivacy();
  const settings = useSettings();
  return (
    <span className={cn("money", className)}>
      {hidden ? "••••••" : formatMoney(amount, currency ?? settings.currency)}
    </span>
  );
}
