import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-strong shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_50%,transparent),0_8px_30px_-10px_color-mix(in_srgb,var(--accent)_60%,transparent)] hover:shadow-[0_0_0_1px_var(--accent),0_10px_36px_-8px_color-mix(in_srgb,var(--accent)_70%,transparent)]',
  secondary:
    'border border-line-strong text-ink bg-panel hover:bg-panel-strong hover:border-[var(--line-strong)]',
  ghost: 'text-muted hover:text-ink hover:bg-panel',
  danger:
    'bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] text-rose border border-[color-mix(in_srgb,var(--rose)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--rose)_22%,transparent)]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[0.82rem]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[0.95rem]',
};

export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return cn(base, variants[variant], sizes[size]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const styles = cn(buttonStyles(variant, size), className);
  const isExternal = /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a href={href} className={styles} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={styles} {...props}>
      {children}
    </Link>
  );
}
