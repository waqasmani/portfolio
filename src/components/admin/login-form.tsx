'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message ?? 'Sign in failed. Please try again.');
        setSubmitting(false);
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Network error — check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-line bg-bg-raised/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur-sm"
    >
      <Field label="Email" htmlFor="login-email" required>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          required
        />
      </Field>
      <Field label="Password" htmlFor="login-password" required>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••••"
          required
        />
      </Field>
      {error && (
        <p className="rounded-lg border border-[color-mix(in_srgb,var(--rose)_35%,transparent)] bg-[color-mix(in_srgb,var(--rose)_8%,transparent)] px-3 py-2 text-[0.8rem] text-rose" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
        {!submitting && <LogIn className="size-4" aria-hidden />}
      </Button>
    </form>
  );
}
