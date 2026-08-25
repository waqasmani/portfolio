import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Deterministic generative cover art for projects and articles — layered
 * gradients, an orbital ring system, and a fine grid, all seeded from the
 * slug so every item gets a stable, unique composition. Pure SVG: zero
 * image weight, crisp at any size, adapts to both themes.
 */

const accentPairs: Record<string, [string, string]> = {
  indigo: ['#8b95ff', '#5ec2f7'],
  sky: ['#5ec2f7', '#3ddba0'],
  emerald: ['#3ddba0', '#5ec2f7'],
  amber: ['#ffc466', '#ff7d9c'],
  rose: ['#ff7d9c', '#b78cff'],
  violet: ['#b78cff', '#5ec2f7'],
};

function hashSeed(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

interface CoverArtProps {
  seed: string;
  accent?: string;
  /** Large ghost glyph drawn into the art (usually the first letter). */
  glyph?: string;
  className?: string;
}

export function CoverArt({ seed, accent = 'indigo', glyph, className }: CoverArtProps) {
  const id = useId().replace(/[:]/g, '');
  const [colorA, colorB] = accentPairs[accent] ?? accentPairs.indigo;
  const rand = hashSeed(seed);

  const blobAX = 120 + rand() * 260;
  const blobAY = 90 + rand() * 160;
  const blobBX = 420 + rand() * 280;
  const blobBY = 220 + rand() * 200;
  const beamRotation = -35 + rand() * 24;
  const ringX = 190 + rand() * 420;
  const ringY = 110 + rand() * 260;
  const ringBase = 46 + rand() * 40;
  const dotCount = 3 + Math.floor(rand() * 3);
  const dots = Array.from({ length: dotCount }, () => ({
    x: 60 + rand() * 680,
    y: 50 + rand() * 400,
    r: 2 + rand() * 3,
    color: rand() > 0.5 ? colorA : colorB,
  }));

  return (
    <svg
      viewBox="0 0 800 500"
      className={cn('h-full w-full', className)}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${id}-a`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colorA} stopOpacity="0.55" />
          <stop offset="100%" stopColor={colorA} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-b`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colorB} stopOpacity="0.45" />
          <stop offset="100%" stopColor={colorB} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorA} stopOpacity="0" />
          <stop offset="50%" stopColor={colorA} stopOpacity="0.16" />
          <stop offset="100%" stopColor={colorB} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-glyph`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
        <pattern id={`${id}-grid`} width="36" height="36" patternUnits="userSpaceOnUse">
          <path
            d="M 36 0 L 0 0 0 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.12"
          />
        </pattern>
      </defs>

      {/* Base */}
      <rect width="800" height="500" fill="var(--bg-raised)" />
      <rect width="800" height="500" fill={`url(#${id}-grid)`} className="text-faint" />

      {/* Soft color fields */}
      <circle cx={blobAX} cy={blobAY} r="300" fill={`url(#${id}-a)`} />
      <circle cx={blobBX} cy={blobBY} r="340" fill={`url(#${id}-b)`} />

      {/* Diagonal beam */}
      <rect
        x="-200"
        y="200"
        width="1200"
        height="130"
        fill={`url(#${id}-beam)`}
        transform={`rotate(${beamRotation} 400 250)`}
      />

      {/* Orbital rings */}
      <g stroke={colorA} fill="none" opacity="0.5">
        <circle cx={ringX} cy={ringY} r={ringBase} strokeWidth="1" opacity="0.9" />
        <circle cx={ringX} cy={ringY} r={ringBase * 1.7} strokeWidth="0.8" opacity="0.5" />
        <circle cx={ringX} cy={ringY} r={ringBase * 2.6} strokeWidth="0.6" opacity="0.25" />
        <circle cx={ringX + ringBase * 1.7} cy={ringY} r="3.5" fill={colorB} stroke="none" />
      </g>

      {/* Scatter */}
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.color} opacity="0.6" />
      ))}

      {/* Ghost glyph */}
      {glyph ? (
        <text
          x="640"
          y="430"
          fontSize="340"
          fontWeight="700"
          fill={`url(#${id}-glyph)`}
          opacity="0.14"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          {glyph}
        </text>
      ) : null}

      {/* Vignette to seat the art into cards */}
      <rect width="800" height="500" fill="var(--bg-raised)" opacity="0.18" />
    </svg>
  );
}
