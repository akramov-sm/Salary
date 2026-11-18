/** «1 операция», «2 операции», «5 операций». */
export function pluralOps(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "операция";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "операции";
  return "операций";
}
