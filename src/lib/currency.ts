export const CURRENCIES = {
  RUB: { symbol: "₽", locale: "ru-RU" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  KZT: { symbol: "₸", locale: "ru-KZ" },
  UZS: { symbol: "сум", locale: "uz-UZ" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/** 1842500 -> "1 842 500,00 ₽" (non-breaking spaces, 2 decimals). */
export function formatMoney(amount: number, currency: CurrencyCode = "RUB"): string {
  const { symbol } = CURRENCIES[currency];
  const num = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/[\u202f\u00a0\s]/g, "\u00a0");
  return `${num}\u00a0${symbol}`;
}
