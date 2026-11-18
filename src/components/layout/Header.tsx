"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Eye, EyeOff, LogOut, Settings, Tags, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrivacy, useSettings } from "@/components/providers/AppProviders";
import { logoutAction } from "@/actions/auth.actions";

export function Header() {
  const { hidden, toggle } = usePrivacy();
  const { name, email } = useSettings();
  const [, startTransition] = useTransition();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          Salary
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-pressed={hidden}
            aria-label={hidden ? "Показать суммы" : "Скрыть суммы"}
            title={hidden ? "Показать суммы (H)" : "Скрыть суммы (H)"}
          >
            {hidden ? <EyeOff strokeWidth={1.5} /> : <Eye strokeWidth={1.5} />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Меню профиля">
                <span className="grid size-7 place-items-center rounded-md border border-border bg-secondary">
                  <User className="size-4" strokeWidth={1.5} />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs font-normal text-text-secondary">{email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/categories">
                  <Tags strokeWidth={1.5} /> Категории
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings strokeWidth={1.5} /> Настройки
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => startTransition(() => logoutAction())}>
                <LogOut strokeWidth={1.5} /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
