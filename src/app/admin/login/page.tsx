import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { LoginForm } from '@/components/admin/login-form';
import { developer } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/admin');

  return (
    <div className="noise relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 30%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 72%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-line-strong bg-panel font-mono text-[0.95rem] font-bold">
            <span className="text-gradient">{'{'}CF{'}'}</span>
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
            {developer.name} — Admin
          </h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage the site</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-[0.75rem] text-faint">
          Protected area. All access is logged.
        </p>
      </div>
    </div>
  );
}
