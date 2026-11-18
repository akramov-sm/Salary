import { cn } from "@/lib/utils";

/** Заглушка ожидания: спокойный пульс вместо белой вспышки. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-secondary/70", className)}
      {...props}
    />
  );
}
