/** 8.4 → «+8,4%» (с знаком) или «8,4%»; отрицательные — с минусом «−». */
export function formatPct(n: number, signed = false): string {
  const abs = Math.abs(n).toString().replace(".", ",");
  const sign = n < 0 ? "−" : signed ? "+" : "";
  return `${sign}${abs}%`;
}
