import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--ink)_7%,transparent)]',
        className
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-panel p-5', className)} aria-hidden="true">
      <Skeleton className="mb-4 aspect-[16/9] w-full rounded-xl" />
      <Skeleton className="mb-2.5 h-4 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  );
}
