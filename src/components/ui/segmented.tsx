"use client";

import { cn } from "@/lib/utils";

/** Компактный переключатель с чёткой рамкой (период, тип операции и т.п.). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-md border border-border bg-card p-0.5", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-sm px-3 text-sm text-text-secondary transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
            value === o.value && "bg-secondary text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
