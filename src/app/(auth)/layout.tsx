import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-mint/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          Salary
        </Link>
        {children}
      </div>
    </main>
  );
}
