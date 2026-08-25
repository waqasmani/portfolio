'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { z } from 'zod';
import { settingsSchema, type SettingsInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { AdminPanel } from '@/components/admin/ui';
import { StringListInput, Toggle } from '@/components/admin/editor-inputs';

type FieldErrors = Partial<Record<string, string[]>>;

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [form, setForm] = useState<SettingsInput>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const set = <K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setSocial = (key: string, value: string) => {
    setForm((current) => ({ ...current, socials: { ...current.socials, [key]: value } }));
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = {
      ...form,
      socials: Object.fromEntries(
        Object.entries(form.socials).filter(([, url]) => url.trim().length > 0)
      ),
    };
    const parsed = settingsSchema.safeParse(cleaned);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      toast('error', 'Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        toast('error', data.message ?? 'Could not save settings');
        return;
      }
      toast('success', 'Settings saved', 'Changes are live on the public site.');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AdminPanel title="Availability">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="st-availability">
            <Select
              id="st-availability"
              value={form.availability}
              onChange={(event) => set('availability', event.target.value as SettingsInput['availability'])}
            >
              <option value="AVAILABLE">🟢 Available for projects</option>
              <option value="LIMITED">🟡 Limited availability</option>
              <option value="UNAVAILABLE">🔴 Fully booked</option>
            </Select>
          </Field>
          <Field label="Next available date" htmlFor="st-next" error={errors.nextAvailableDate?.[0]}>
            <Input id="st-next" value={form.nextAvailableDate} onChange={(event) => set('nextAvailableDate', event.target.value)} placeholder="March 2026" />
          </Field>
          <Field label="Availability note" htmlFor="st-note" error={errors.availabilityNote?.[0]} className="sm:col-span-2" hint="Shown in the hero, footer, and contact page.">
            <Input id="st-note" value={form.availabilityNote} onChange={(event) => set('availabilityNote', event.target.value)} />
          </Field>
          <Field label="Preferred project types" htmlFor="st-preferred" className="sm:col-span-2">
            <StringListInput id="st-preferred" value={form.preferredProjects} onChange={(next) => set('preferredProjects', next)} placeholder="SaaS platforms, API systems…" max={8} />
          </Field>
          <Field label="Response time" htmlFor="st-response" error={errors.responseTime?.[0]}>
            <Input id="st-response" value={form.responseTime} onChange={(event) => set('responseTime', event.target.value)} placeholder="Within 24 hours" />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Live chat">
        <div className="space-y-5">
          <Toggle
            id="st-chat-online"
            checked={form.chatOnline}
            onChange={(next) => set('chatOnline', next)}
            label={form.chatOnline ? 'Shown as online — you reply personally' : 'Shown as away — the assistant covers for you'}
          />
          <Field label="Offline auto-reply" htmlFor="st-chat-offline" error={errors.chatOfflineMessage?.[0]} hint="Sent once per conversation when you're away and no FAQ matches.">
            <Textarea id="st-chat-offline" rows={2} value={form.chatOfflineMessage} onChange={(event) => set('chatOfflineMessage', event.target.value)} maxLength={400} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Developer information">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="st-name" required error={errors.developerName?.[0]}>
            <Input id="st-name" value={form.developerName} onChange={(event) => set('developerName', event.target.value)} />
          </Field>
          <Field label="Title" htmlFor="st-title" required error={errors.developerTitle?.[0]}>
            <Input id="st-title" value={form.developerTitle} onChange={(event) => set('developerTitle', event.target.value)} />
          </Field>
          <Field label="Public email" htmlFor="st-email" required error={errors.developerEmail?.[0]}>
            <Input id="st-email" type="email" value={form.developerEmail} onChange={(event) => set('developerEmail', event.target.value)} />
          </Field>
          <Field label="Resume path" htmlFor="st-resume" error={errors.resumePath?.[0]} hint="File in /public or a full URL.">
            <Input id="st-resume" value={form.resumePath} onChange={(event) => set('resumePath', event.target.value)} />
          </Field>
          <Field label="Location" htmlFor="st-location" error={errors.location?.[0]}>
            <Input id="st-location" value={form.location} onChange={(event) => set('location', event.target.value)} />
          </Field>
          <Field label="Timezone" htmlFor="st-timezone" error={errors.timezone?.[0]}>
            <Input id="st-timezone" value={form.timezone} onChange={(event) => set('timezone', event.target.value)} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Social links">
        <div className="grid gap-5 sm:grid-cols-2">
          {(['github', 'linkedin', 'x'] as const).map((network) => (
            <Field
              key={network}
              label={network === 'x' ? 'X (Twitter)' : network.charAt(0).toUpperCase() + network.slice(1)}
              htmlFor={`st-social-${network}`}
            >
              <Input
                id={`st-social-${network}`}
                value={form.socials[network] ?? ''}
                onChange={(event) => setSocial(network, event.target.value)}
                placeholder={`https://${network === 'x' ? 'x.com' : `${network}.com`}/…`}
              />
            </Field>
          ))}
        </div>
        {errors.socials && <p className="mt-2 text-[0.78rem] text-rose">Social links must be valid URLs.</p>}
      </AdminPanel>

      <AdminPanel title="SEO defaults">
        <div className="grid gap-5">
          <Field label="Site title" htmlFor="st-seo-title" error={errors.seoTitle?.[0]}>
            <Input id="st-seo-title" value={form.seoTitle} onChange={(event) => set('seoTitle', event.target.value)} maxLength={160} />
          </Field>
          <Field label="Site description" htmlFor="st-seo-desc" error={errors.seoDescription?.[0]}>
            <Textarea id="st-seo-desc" rows={2} value={form.seoDescription} onChange={(event) => set('seoDescription', event.target.value)} maxLength={300} />
          </Field>
        </div>
      </AdminPanel>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" loading={saving} className="shadow-[var(--shadow-soft)]">
          <Save className="size-4" aria-hidden />
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}
