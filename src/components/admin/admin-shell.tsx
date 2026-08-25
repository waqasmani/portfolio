'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Quote,
  FolderKanban,
  Settings,
  X,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { ThemeToggle } from '@/components/site/theme-toggle';

interface AdminUser {
  name: string;
  email: string;
  role: 'ADMIN' | 'EDITOR';
}

const navigation = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
  { label: 'Project Requests', href: '/admin/requests', icon: Inbox },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban, adminOnly: true },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Quote },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings, adminOnly: true },
];

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = navigation.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/admin/login');
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.86rem] font-medium transition-colors',
              active
                ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
                : 'text-muted hover:bg-panel hover:text-ink'
            )}
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userBox = (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold text-[#0b1020]"
          style={{ background: 'var(--gradient-brand)' }}
          aria-hidden
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.82rem] font-medium text-ink">{user.name}</p>
          <p className="truncate font-mono text-[0.66rem] text-faint uppercase">{user.role}</p>
        </div>
        <button
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-lg p-2 text-faint transition-colors hover:bg-panel hover:text-rose"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-bg-raised/60 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-line-strong bg-panel font-mono text-[0.72rem] font-bold">
            <span className="text-gradient">{'{'}W{'}'}</span>
          </span>
          <span className="text-[0.9rem] font-semibold text-ink">Admin</span>
        </div>
        {nav}
        {userBox}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-bg-raised">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-[0.9rem] font-semibold text-ink">Admin</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-faint hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {userBox}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-muted hover:text-ink lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.78rem] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            View site
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
