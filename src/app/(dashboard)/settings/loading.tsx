import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-busy="true" aria-label="Загрузка настроек">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-64" />
      <Skeleton className="h-56" />
    </div>
  );
}
