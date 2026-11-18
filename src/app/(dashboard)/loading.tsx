import { Skeleton } from "@/components/ui/skeleton";

/** Скелетон Bento-сетки дашборда: повторяет раскладку карточек, чтобы страница не «прыгала». */
export default function DashboardLoading() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Загрузка дашборда"
    >
      <Skeleton className="h-56 md:col-span-2 lg:col-span-2" />
      <Skeleton className="h-56" />
      <Skeleton className="h-56" />
      <Skeleton className="h-80 md:col-span-2 lg:col-span-2" />
      <Skeleton className="h-80 md:col-span-2 lg:col-span-2" />
    </div>
  );
}
