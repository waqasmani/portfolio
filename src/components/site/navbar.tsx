'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Mail } from 'lucide-react';
import { mainNav, developer, socials } from '@/config/site';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { ButtonLink } from '@/components/ui/button';
import { GithubIcon, LinkedinIcon } from '@/components/ui/social-icons';

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${developer.name} — home`}>
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl border border-line-strong bg-panel font-mono text-[0.82rem] font-bold text-ink transition-colors group-hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]">
        <span className="text-gradient">{'{'}W{'}'}</span>
      </span>
      <span className="hidden text-[0.95rem] font-semibold tracking-tight text-ink sm:block">
        {developer.name}
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    const initialFrame = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(initialFrame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300',
        scrolled || menuOpen ? 'glass border-b' : 'border-b border-transparent'
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-panel p-1">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative z-10 block rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors',
                      active ? 'text-ink' : 'text-muted hover:text-ink'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={
                          reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }
                        }
                        className="absolute inset-0 -z-10 rounded-full bg-panel-strong shadow-[inset_0_0_0_1px_var(--line-strong)]"
                      />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <ButtonLink href="/contact" size="sm" className="hidden md:inline-flex">
            Let&apos;s Work Together
            <ArrowUpRight className="size-4" aria-hidden />
          </ButtonLink>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="relative flex size-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-line-strong lg:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span
              className={cn(
                'absolute h-px w-4 bg-current transition-transform duration-300',
                menuOpen ? 'rotate-45' : '-translate-y-[3.5px]'
              )}
            />
            <span
              className={cn(
                'absolute h-px w-4 bg-current transition-transform duration-300',
                menuOpen ? '-rotate-45' : 'translate-y-[3.5px]'
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobile slide-out */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="glass fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-y-auto border-t border-line lg:hidden"
          >
            <nav aria-label="Mobile" className="shell flex-1 py-6">
              <ul className="space-y-1">
                {mainNav.map((item, index) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <motion.li
                      key={item.href}
                      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * index, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium transition-colors',
                          active ? 'bg-panel-strong text-ink' : 'text-muted hover:bg-panel hover:text-ink'
                        )}
                      >
                        {item.label}
                        <ArrowUpRight
                          className={cn('size-4.5', active ? 'text-accent' : 'text-faint')}
                          aria-hidden
                        />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <div className="shell border-t border-line py-5">
              <ButtonLink href="/contact" className="w-full" onClick={close}>
                Let&apos;s Work Together
                <ArrowUpRight className="size-4" aria-hidden />
              </ButtonLink>
              <div className="mt-4 flex items-center justify-center gap-5 text-faint">
                <a href={socials.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="transition-colors hover:text-ink">
                  <GithubIcon className="size-5" />
                </a>
                <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-ink">
                  <LinkedinIcon className="size-5" />
                </a>
                <a href={`mailto:${developer.email}`} aria-label="Email" className="transition-colors hover:text-ink">
                  <Mail className="size-5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
