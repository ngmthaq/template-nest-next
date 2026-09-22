import { Skeleton } from '@/libs/shadcn-ui/skeleton';

/** Suspense fallback for `HealthReportAsync`, shown while the live report loads. */
export function HealthReportFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
