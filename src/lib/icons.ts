import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookOpen,
  Bus,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  PawPrint,
  Plane,
  Shirt,
  ShoppingBasket,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
} from "lucide-react";

/** Набор строгих контурных иконок для категорий. */
export const ICONS: Record<string, LucideIcon> = {
  ShoppingBasket,
  Home,
  Bus,
  Car,
  Coffee,
  Utensils,
  Smartphone,
  Wifi,
  HeartPulse,
  Dumbbell,
  Clapperboard,
  Shirt,
  Plane,
  BookOpen,
  PawPrint,
  Gift,
  Banknote,
  Laptop,
  TrendingUp,
  Wallet,
};

export const ICON_NAMES = Object.keys(ICONS);
