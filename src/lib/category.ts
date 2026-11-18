import { CircleDollarSign, type LucideIcon } from "lucide-react";
import { ICONS } from "./icons";
import type { CategoryDTO } from "./types";

/** Категория на клиенте: имя иконки из БД превращено в компонент Lucide. */
export type Category = Omit<CategoryDTO, "icon"> & { icon: LucideIcon; iconName: string };

export const toCategory = (c: CategoryDTO): Category => ({
  ...c,
  iconName: c.icon,
  icon: ICONS[c.icon] ?? CircleDollarSign,
});

export const CATEGORY_COLORS = ["#06D6A0", "#00BBF9", "#F43F5E", "#F59E0B", "#A78BFA", "#94A3B8"];
