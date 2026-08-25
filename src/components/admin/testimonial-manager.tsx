'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { z } from 'zod';
import { testimonialUpsertSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Toggle } from '@/components/admin/editor-inputs';

export interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  projectName: string | null;
  avatarSeed: string;
  sortOrder: number;
  published: boolean;
}

type FormState = Omit<TestimonialRow, 'id' | 'projectName'> & { projectName: string };

const empty: FormState = {
  name: '',
  role: '',
  company: '',
  quote: '',
  projectName: '',
  avatarSeed: '',
  sortOrder: 0,
  published: true,
};

export function TestimonialEditorButton({
  testimonial,
  variant = 'edit',
}: {
  testimonial?: TestimonialRow;
  variant?: 'edit' | 'new';
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(
    testimonial ? { ...testimonial, projectName: testimonial.projectName ?? '' } : empty
  );
  const [errors, setErrors] = useState<Partial<Record<string, string[]>>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = testimonialUpsertSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        testimonial ? `/api/admin/testimonials/${testimonial.id}` : '/api/admin/testimonials',
        {
          method: testimonial ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.errors) setErrors(data.errors);
        toast('error', data.message ?? 'Could not save');
        return;
      }
      toast('success', testimonial ? 'Testimonial updated' : 'Testimonial added');
      setOpen(false);
      if (!testimonial) setForm(empty);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {variant === 'new' ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Add testimonial
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={testimonial ? `Edit — ${testimonial.name}` : 'New testimonial'}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="tm-name" required error={errors.name?.[0]}>
              <Input id="tm-name" value={form.name} onChange={(event) => set('name', event.target.value)} data-autofocus />
            </Field>
            <Field label="Role" htmlFor="tm-role" required error={errors.role?.[0]}>
              <Input id="tm-role" value={form.role} onChange={(event) => set('role', event.target.value)} />
            </Field>
            <Field label="Company" htmlFor="tm-company" required error={errors.company?.[0]}>
              <Input id="tm-company" value={form.company} onChange={(event) => set('company', event.target.value)} />
            </Field>
            <Field label="Project" htmlFor="tm-project" error={errors.projectName?.[0]}>
              <Input id="tm-project" value={form.projectName} onChange={(event) => set('projectName', event.target.value)} placeholder="Optional" />
            </Field>
          </div>
          <Field label="Quote" htmlFor="tm-quote" required error={errors.quote?.[0]}>
            <Textarea id="tm-quote" rows={4} value={form.quote} onChange={(event) => set('quote', event.target.value)} maxLength={1200} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" htmlFor="tm-sort" error={errors.sortOrder?.[0]}>
              <Input id="tm-sort" type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', Number(event.target.value))} />
            </Field>
            <div className="flex items-end pb-1.5">
              <Toggle id="tm-published" checked={form.published} onChange={(next) => set('published', next)} label="Published" />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save testimonial'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
