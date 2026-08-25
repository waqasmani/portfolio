import {
  siCloudflare,
  siDocker,
  siExpress,
  siFastify,
  siGit,
  siGithub,
  siGithubactions,
  siJavascript,
  siLinux,
  siMariadb,
  siMysql,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siPm2,
  siPostgresql,
  siPrisma,
  siReact,
  siRedis,
  siStripe,
  siTailwindcss,
  siTypescript,
  siUbuntu,
  siVuedotjs,
  type SimpleIcon,
} from 'simple-icons';
import {
  Braces,
  Database,
  Network,
  Radio,
  Server,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Technology icons: real brand marks via simple-icons, lucide glyphs for
 * concepts without a logo. Brand colors are luminance-adjusted per theme so
 * dark marks (Next.js, Express) stay visible on the dark background and
 * light marks stay visible in light mode.
 */

const brandIcons: Record<string, SimpleIcon> = {
  'Next.js': siNextdotjs,
  React: siReact,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  'Tailwind CSS': siTailwindcss,
  'Vue.js': siVuedotjs,
  'Node.js': siNodedotjs,
  Express: siExpress,
  Fastify: siFastify,
  PostgreSQL: siPostgresql,
  MariaDB: siMariadb,
  MySQL: siMysql,
  Prisma: siPrisma,
  Redis: siRedis,
  Linux: siLinux,
  Ubuntu: siUbuntu,
  Docker: siDocker,
  Nginx: siNginx,
  Cloudflare: siCloudflare,
  'Cloudflare R2': siCloudflare,
  'GitHub Actions': siGithubactions,
  PM2: siPm2,
  Stripe: siStripe,
  Git: siGit,
  GitHub: siGithub,
};

const conceptIcons: Record<string, LucideIcon> = {
  'REST APIs': Network,
  Authentication: ShieldCheck,
  WebSockets: Radio,
  SSE: Radio,
  API: Braces,
  Database: Database,
  Server: Server,
  Automation: Workflow,
};

function luminance(hex: string): number {
  const value = parseInt(hex, 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function themedColors(hex: string): { dark: string; light: string } {
  const lum = luminance(hex);
  return {
    // On the dark background, very dark marks flip to ink.
    dark: lum < 0.16 ? 'var(--ink)' : `#${hex}`,
    // In light mode, very bright marks (JS yellow is fine, near-white isn't) flip to ink.
    light: lum > 0.82 ? 'var(--ink)' : `#${hex}`,
  };
}

interface TechIconProps {
  name: string;
  className?: string;
  /** Render in muted single color instead of brand color. */
  muted?: boolean;
}

export function TechIcon({ name, className, muted = false }: TechIconProps) {
  const brand = brandIcons[name];
  if (brand) {
    const colors = themedColors(brand.hex);
    return (
      <svg
        role="img"
        aria-hidden
        viewBox="0 0 24 24"
        className={cn('tech-icon size-5 shrink-0', className)}
        style={
          muted
            ? undefined
            : ({ '--brand-dark': colors.dark, '--brand-light': colors.light } as React.CSSProperties)
        }
      >
        <path d={brand.path} />
      </svg>
    );
  }

  const Concept =
    conceptIcons[name] ??
    conceptIcons[Object.keys(conceptIcons).find((key) => name.includes(key)) ?? ''] ??
    Braces;
  return <Concept className={cn('size-5 shrink-0 text-muted', className)} aria-hidden />;
}
