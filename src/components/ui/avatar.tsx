import { cn, initials } from '@/lib/utils';

const avatarPalettes = [
  ['#8b95ff', '#5ec2f7'],
  ['#3ddba0', '#5ec2f7'],
  ['#ffc466', '#ff7d9c'],
  ['#ff7d9c', '#b78cff'],
  ['#b78cff', '#8b95ff'],
  ['#5ec2f7', '#3ddba0'],
] as const;

function paletteFor(seed: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return avatarPalettes[Math.abs(hash) % avatarPalettes.length];
}

interface AvatarProps {
  name: string;
  seed?: string;
  className?: string;
}

/** Deterministic gradient-initials avatar — no external images needed. */
export function Avatar({ name, seed, className }: AvatarProps) {
  const [from, to] = paletteFor(seed || name);
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-semibold text-[#0b1020] ring-1 ring-line',
        className
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
