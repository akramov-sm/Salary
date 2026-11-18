import type { CurrencyCode } from "@/lib/currency";
import { AppProviders } from "@/components/providers/AppProviders";
import { Header } from "@/components/layout/Header";
import { FloatingDock } from "@/components/layout/FloatingDock";
import { TransactionSheet } from "@/components/transactions/TransactionSheet";
import { getCurrentUser } from "@/lib/session";
import { listCategories } from "@/db/queries";
import { logoutAction } from "@/actions/auth.actions";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  // Сессия есть, а пользователя в базе уже нет — предлагаем выйти.
  if (!user) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <form action={logoutAction} className="space-y-3">
          <p className="text-sm text-text-secondary">Сессия недействительна.</p>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Войти заново
          </button>
        </form>
      </main>
    );
  }

  const categories = await listCategories(user.id);

  return (
    <AppProviders
      categories={categories}
      user={{ name: user.name, email: user.email, currency: user.currency as CurrencyCode }}
    >
      <div className="min-h-dvh bg-background">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6">
          {children}
        </main>
        <FloatingDock />
        <TransactionSheet />
      </div>
    </AppProviders>
  );
}
