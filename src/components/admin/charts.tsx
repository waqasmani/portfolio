import { cn, formatNumber } from '@/lib/utils';

/**
 * Lightweight server-rendered SVG charts for the admin dashboard — no
 * charting library, no client JavaScript, theme-aware via currentColor and
 * CSS variables.
 */

interface AreaPoint {
  date: string;
  value: number;
  secondary?: number;
}

export function AreaChart({
  points,
  height = 180,
  primaryLabel = 'Pageviews',
  secondaryLabel = 'Visitors',
  className,
}: {
  points: AreaPoint[];
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  if (points.length === 0) return null;
  const width = 720;
  const pad = { top: 12, right: 8, bottom: 24, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map((p) => Math.max(p.value, p.secondary ?? 0)));

  const x = (index: number) => pad.left + (index / Math.max(1, points.length - 1)) * innerW;
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;

  const linePath = (get: (p: AreaPoint) => number) =>
    points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(get(point)).toFixed(1)}`).join(' ');

  const areaPath = `${linePath((p) => p.value)} L${x(points.length - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pad.left},${(pad.top + innerH).toFixed(1)} Z`;

  const gridLines = [0.25, 0.5, 0.75];
  const labelEvery = Math.ceil(points.length / 6);

  return (
    <figure className={className}>
      <div className="mb-3 flex items-center gap-5 text-[0.72rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-accent" aria-hidden /> {primaryLabel}
        </span>
        {points.some((p) => p.secondary !== undefined) && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-sky" aria-hidden /> {secondaryLabel}
          </span>
        )}
        <span className="ml-auto font-mono text-faint">peak {formatNumber(max)}</span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px]"
          role="img"
          aria-label={`${primaryLabel} over time`}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLines.map((fraction) => (
            <line
              key={fraction}
              x1={pad.left}
              x2={width - pad.right}
              y1={pad.top + innerH * fraction}
              y2={pad.top + innerH * fraction}
              stroke="var(--line)"
              strokeDasharray="3 5"
            />
          ))}

          <path d={areaPath} fill="url(#area-fill)" />
          <path d={linePath((p) => p.value)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          {points.some((p) => p.secondary !== undefined) && (
            <path
              d={linePath((p) => p.secondary ?? 0)}
              fill="none"
              stroke="var(--sky)"
              strokeWidth="1.6"
              strokeDasharray="1 0"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {points.map((point, index) =>
            index % labelEvery === 0 ? (
              <text
                key={point.date}
                x={x(index)}
                y={height - 6}
                textAnchor="middle"
                className="fill-[var(--faint)]"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {point.date.slice(5)}
              </text>
            ) : null
          )}
        </svg>
      </div>
    </figure>
  );
}

export function BarList({
  items,
  className,
  formatValue = formatNumber,
}: {
  items: Array<{ label: string; value: number; href?: string }>;
  className?: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="group relative">
          <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-line px-3 py-2">
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-all"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
            <span className="relative min-w-0 flex-1 truncate text-[0.82rem] text-ink">{item.label}</span>
            <span className="relative font-mono text-[0.75rem] text-muted tabular-nums">
              {formatValue(item.value)}
            </span>
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="py-4 text-center text-sm text-faint">No data yet</li>}
    </ul>
  );
}

const donutColors = ['var(--accent)', 'var(--sky)', 'var(--emerald)', 'var(--amber)', 'var(--rose)'];

export function Donut({
  items,
  className,
}: {
  items: Array<{ label: string; value: number }>;
  className?: string;
}) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" role="img" aria-label="Breakdown">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--line)" strokeWidth="12" />
        {items.map((item, index) => {
          const fraction = item.value / total;
          const dash = fraction * circumference;
          const element = (
            <circle
              key={item.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={donutColors[index % donutColors.length]}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return element;
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2 text-[0.8rem]">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: donutColors[index % donutColors.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-muted capitalize">{item.label}</span>
            <span className="font-mono text-[0.72rem] text-faint tabular-nums">
              {Math.round((item.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
