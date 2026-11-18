// Работа с часовыми поясами без внешних библиотек.
// Сервер (Vercel) работает в UTC, а «сегодня» и «этот месяц» зависят от пояса пользователя —
// его имя клиент кладёт в cookie `tz`.

export const DEFAULT_TZ = "UTC";

export function resolveTz(tz?: string | null): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function parts(tz: string, d: Date) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** Смещение пояса от UTC в мс на момент d. */
function offsetMs(tz: string, d: Date): number {
  const p = parts(tz, d);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(d.getTime() / 1000) * 1000;
}

/** Момент локальной полуночи для календарной даты y-m-d в поясе tz (m: 1–12, день может «переполняться»). */
function localMidnight(tz: string, y: number, m: number, d: number): Date {
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - offsetMs(tz, new Date(guess));
  t = guess - offsetMs(tz, new Date(t));
  return new Date(t);
}

export function startOfDay(tz: string, d: Date): Date {
  const p = parts(tz, d);
  return localMidnight(tz, p.y, p.m, p.d);
}

export function addDays(tz: string, dayStart: Date, n: number): Date {
  const p = parts(tz, dayStart);
  return localMidnight(tz, p.y, p.m, p.d + n);
}

export function startOfMonth(tz: string, d: Date): Date {
  const p = parts(tz, d);
  return localMidnight(tz, p.y, p.m, 1);
}

/** «YYYY-MM-DD» момента в поясе tz. */
export function dayKey(tz: string, d: Date): string {
  const p = parts(tz, d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
