const pad = (n: number) => String(n).padStart(2, "0");

// Все функции ниже работают в локальном часовом поясе браузера.

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());

export function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export const nowClock = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** ISO-момент (UTC) → локальная дата «YYYY-MM-DD». */
export const isoToLocalDate = (iso: string) => toISODate(new Date(iso));

/** ISO-момент (UTC) → локальное время «HH:MM». */
export const isoToClock = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Локальные «YYYY-MM-DD» + «HH:MM» → ISO-момент в UTC. */
export const localToISO = (date: string, clock: string) =>
  new Date(`${date}T${clock}:00`).toISOString();

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** «Сегодня, 18:42» / «Вчера, 12:00» / «12 ноя, 10:05». */
export function formatTxTime(iso: string, clock: string) {
  if (iso === todayISO()) return `Сегодня, ${clock}`;
  if (iso === daysAgoISO(1)) return `Вчера, ${clock}`;
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}, ${clock}`;
}

/** Заголовок дня в списке: «Сегодня» / «Вчера» / «12 ноя». */
export function dayHeading(isoDate: string) {
  return formatTxTime(isoDate, "").replace(/,\s*$/, "");
}

export type Period = "all" | "today" | "week" | "month";

/** Нижняя граница периода (локальная полночь) как ISO-момент; null — без ограничения. */
export function periodFromISO(p: Period): string | null {
  if (p === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === "week") d.setDate(d.getDate() - 6);
  if (p === "month") d.setDate(1);
  return d.toISOString();
}
