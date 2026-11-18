"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { CurrencyCode } from "@/lib/currency";
import { updateCurrency, updateName } from "@/actions/user.actions";
import type { ActionResult } from "@/lib/validation";
import { toCategory, type Category } from "@/lib/category";
import type { CategoryDTO, TxDTO } from "@/lib/types";

type PrivacyCtx = { hidden: boolean; toggle: () => void };

type SheetCtx = {
  open: boolean;
  /** Операция, которую редактируют; null — создание новой. */
  editing: TxDTO | null;
  openNew: () => void;
  openEdit: (tx: TxDTO) => void;
  close: () => void;
  /** Растёт после каждого изменения данных — списки на клиенте перезагружаются. */
  version: number;
  bump: () => void;
};

export type AppUser = { name: string; email: string; currency: CurrencyCode };

type Settings = {
  currency: CurrencyCode;
  name: string;
  email: string;
  setCurrency: (c: CurrencyCode) => void;
  saveName: (n: string) => Promise<ActionResult>;
};

type CategoriesCtx = {
  categories: Category[];
  categoryById: (id: string) => Category | undefined;
};

const PrivacyContext = createContext<PrivacyCtx | null>(null);
const SheetContext = createContext<SheetCtx | null>(null);
const SettingsContext = createContext<Settings | null>(null);
const CategoriesContext = createContext<CategoriesCtx | null>(null);

const PRIVACY_KEY = "salary:privacy";

/** Кладёт часовой пояс браузера в cookie, чтобы сервер считал «сегодня» и «месяц» правильно. */
function TimezoneSync() {
  const router = useRouter();
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const current = document.cookie
        .split("; ")
        .find((c) => c.startsWith("tz="))
        ?.slice(3);
      if (tz && decodeURIComponent(current ?? "") !== tz) {
        document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }
    } catch {}
  }, [router]);
  return null;
}

export function AppProviders({
  user,
  categories: categoryDTOs,
  children,
}: {
  user: AppUser;
  categories: CategoryDTO[];
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TxDTO | null>(null);
  const [version, setVersion] = useState(0);
  const [currency, setCurrencyState] = useState<CurrencyCode>(user.currency);
  const [name, setNameState] = useState(user.name);

  useEffect(() => {
    try {
      if (localStorage.getItem(PRIVACY_KEY) === "1") setHidden(true);
    } catch {}
  }, []);

  // Оптимистично меняем валюту и сохраняем в Turso; при ошибке откатываем.
  const currencyRef = useRef(currency);
  const setCurrency = useCallback((c: CurrencyCode) => {
    const prev = currencyRef.current;
    currencyRef.current = c;
    setCurrencyState(c);
    updateCurrency(c).then((r) => {
      if (!r.ok) {
        currencyRef.current = prev;
        setCurrencyState(prev);
      }
    });
  }, []);

  const saveName = useCallback(async (n: string) => {
    const r = await updateName(n);
    if (r.ok) setNameState(n.trim());
    return r;
  }, []);

  const toggle = useCallback(() => {
    setHidden((h) => {
      const next = !h;
      try {
        localStorage.setItem(PRIVACY_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  const privacy = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);

  const sheet = useMemo<SheetCtx>(
    () => ({
      open: sheetOpen,
      editing,
      openNew: () => {
        setEditing(null);
        setSheetOpen(true);
      },
      openEdit: (tx) => {
        setEditing(tx);
        setSheetOpen(true);
      },
      close: () => setSheetOpen(false),
      version,
      bump: () => setVersion((v) => v + 1),
    }),
    [sheetOpen, editing, version],
  );

  const settings = useMemo(
    () => ({ currency, name, email: user.email, setCurrency, saveName }),
    [currency, name, user.email, setCurrency, saveName],
  );

  const cats = useMemo<CategoriesCtx>(() => {
    const categories = categoryDTOs.map(toCategory);
    const map = new Map(categories.map((c) => [c.id, c]));
    return { categories, categoryById: (id) => map.get(id) };
  }, [categoryDTOs]);

  return (
    <PrivacyContext.Provider value={privacy}>
      <SettingsContext.Provider value={settings}>
        <SheetContext.Provider value={sheet}>
          <CategoriesContext.Provider value={cats}>
            <TimezoneSync />
            {children}
          </CategoriesContext.Provider>
        </SheetContext.Provider>
      </SettingsContext.Provider>
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used inside AppProviders");
  return ctx;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside AppProviders");
  return ctx;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used inside AppProviders");
  return ctx;
}

/** Состояние боковой шторки добавления/редактирования операции. */
export function useTransactionSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useTransactionSheet must be used inside AppProviders");
  return ctx;
}
