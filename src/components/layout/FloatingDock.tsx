"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftRight, LayoutGrid, Plus, Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTransactionSheet,
  usePrivacy,
} from "@/components/providers/AppProviders";

const LEFT = [
  { href: "/", label: "Дашборд", key: "1", icon: LayoutGrid },
  { href: "/transactions", label: "Транзакции", key: "2", icon: ArrowLeftRight },
];
const RIGHT = [
  { href: "/analytics", label: "Аналитика", key: "3", icon: TrendingUp },
  { href: "/settings", label: "Настройки", key: "4", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function FloatingDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { openNew } = useTransactionSheet();
  const { toggle } = usePrivacy();

  // Горячие клавиши: 1–4 — разделы, N — новая операция, H — скрыть суммы.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k = e.key.toLowerCase();
      const item = [...LEFT, ...RIGHT].find((i) => i.key === k);
      if (item) router.push(item.href);
      else if (k === "n") openNew();
      else if (k === "h") toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, openNew, toggle]);

  const renderItem = (i: (typeof LEFT)[number]) => {
    const active = isActive(pathname, i.href);
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-label={i.label}
        aria-current={active ? "page" : undefined}
        title={`${i.label} (${i.key})`}
        className={cn(
          "relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-md px-3 text-text-secondary transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
          active && "bg-accent text-mint",
        )}
      >
        <i.icon className="size-5" strokeWidth={1.5} />
        <span className="hidden text-sm md:inline">{i.label}</span>
        {active && (
          <span className="absolute bottom-0.5 size-1 rounded-full bg-mint shadow-[0_0_8px_var(--mint-glow)] md:hidden" />
        )}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card/90 p-1.5 shadow-lg shadow-black/40 backdrop-blur-md">
        {LEFT.map(renderItem)}
        <button
          type="button"
          onClick={openNew}
          aria-label="Добавить операцию"
          title="Добавить операцию (N)"
          className="mx-1 grid size-12 place-items-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-mint-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Plus className="size-6" strokeWidth={2} />
        </button>
        {RIGHT.map(renderItem)}
      </div>
    </nav>
  );
}
