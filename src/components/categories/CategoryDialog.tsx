"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createCategory } from "@/actions/category.actions";
import { CATEGORY_COLORS } from "@/lib/category";
import { ICONS, ICON_NAMES } from "@/lib/icons";
import { categoryInputSchema, toFieldErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "income" | "expense";
};

export function CategoryDialog({ open, onOpenChange, kind }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Форма монтируется только при открытии — состояние сбрасывается само. */}
        {open && <CategoryForm kind={kind} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ kind, onDone }: { kind: Props["kind"]; onDone: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_NAMES[0]);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, type: kind, icon, color };
    const parsed = categoryInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(toFieldErrors(parsed.error).name ?? "Проверьте данные");
      return;
    }
    startTransition(async () => {
      const res = await createCategory(parsed.data);
      if (res.ok) {
        toast.success("Категория создана");
        onDone();
      } else {
        const msg = res.fieldErrors?.name ?? res.error ?? "Не удалось создать категорию";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <DialogHeader>
        <DialogTitle>Новая категория · {kind === "expense" ? "расход" : "доход"}</DialogTitle>
        <DialogDescription>Название, иконка и цвет метки.</DialogDescription>
      </DialogHeader>

      <div>
        <label htmlFor="cat-name" className="text-xs text-text-secondary">
          Название
        </label>
        <Input
          id="cat-name"
          autoFocus
          value={name}
          maxLength={24}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          aria-invalid={!!error}
          placeholder="Например, Спорт"
          className="mt-1 h-10"
        />
        {error && <p className="mt-1 text-xs text-expense">{error}</p>}
      </div>

      <div>
        <span className="text-xs text-text-secondary">Иконка</span>
        <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10" role="radiogroup" aria-label="Иконка">
          {ICON_NAMES.map((n) => {
            const Icon = ICONS[n];
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={icon === n}
                aria-label={n}
                onClick={() => setIcon(n)}
                className={cn(
                  "grid h-10 place-items-center rounded-md border border-border text-text-secondary transition-colors hover:text-foreground",
                  icon === n && "border-mint bg-accent text-mint",
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-xs text-text-secondary">Цвет метки</span>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Цвет">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn(
                "size-7 rounded-full border-2 border-transparent",
                color === c && "border-foreground",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Создать
        </Button>
      </DialogFooter>
    </form>
  );
}
