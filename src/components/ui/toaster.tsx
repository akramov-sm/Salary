"use client";

import { Toaster as Sonner } from "sonner";

/** Тихие уведомления в стиле приложения: тёмная карточка, 1px рамка. */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      offset={{ bottom: 100, right: 16 }}
      mobileOffset={{ bottom: 100, left: 16, right: 16 }}
      duration={2500}
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !text-foreground !border !border-border !rounded-md !shadow-lg !shadow-black/40",
          description: "!text-text-secondary",
        },
      }}
    />
  );
}
