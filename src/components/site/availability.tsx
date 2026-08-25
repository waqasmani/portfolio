import { cn } from '@/lib/utils';

type Availability = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';

const dotColors: Record<Availability, string> = {
  AVAILABLE: 'bg-emerald',
  LIMITED: 'bg-amber',
  UNAVAILABLE: 'bg-rose',
};

export const availabilityLabels: Record<Availability, string> = {
  AVAILABLE: 'Available for projects',
  LIMITED: 'Limited availability',
  UNAVAILABLE: 'Fully booked',
};

export function AvailabilityDot({
  availability,
  className,
  pulse = true,
}: {
  availability: Availability;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span className={cn('relative inline-flex size-2', className)} aria-hidden="true">
      {pulse && availability !== 'UNAVAILABLE' ? (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
            dotColors[availability]
          )}
          style={{ animationDuration: '2.2s' }}
        />
      ) : null}
      <span className={cn('relative inline-flex size-2 rounded-full', dotColors[availability])} />
    </span>
  );
}

export function AvailabilityPill({
  availability,
  label,
  className,
}: {
  availability: Availability;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[0.8rem] font-medium text-muted',
        className
      )}
    >
      <AvailabilityDot availability={availability} />
      {label ?? availabilityLabels[availability]}
    </span>
  );
}
