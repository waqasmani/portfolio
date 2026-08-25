'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { z } from 'zod';
import { projectUpsertSchema, type ProjectUpsertInput } from '@/lib/schemas';
import { projectCategories } from '@/config/site';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { AdminPanel } from '@/components/admin/ui';
import {
  AccentPicker,
  RowsEditor,
  SlugInput,
  StringListInput,
  Toggle,
} from '@/components/admin/editor-inputs';

type FieldErrors = Partial<Record<string, string[]>>;

const emptyProject: ProjectUpsertInput = {
  slug: '',
  title: '',
  tagline: '',
  description: '',
  category: 'WEB_APP',
  clientType: '',
  year: new Date().getFullYear(),
  featured: false,
  sortOrder: 0,
  status: 'PUBLISHED',
  accent: 'indigo',
  problem: '',
  solution: '',
  challenges: [],
  architecture: { frontend: [], backend: [], database: [], infrastructure: [], services: [] },
  results: [],
  gallery: [],
  stack: [],
  liveUrl: '',
  githubUrl: '',
};

export function ProjectEditor({
  projectId,
  initial,
}: {
  projectId?: string;
  initial?: ProjectUpsertInput;
}) {
  const [form, setForm] = useState<ProjectUpsertInput>(initial ?? emptyProject);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const router = useRouter();
  const { toast } = useToast();

  const set = <K extends keyof ProjectUpsertInput>(key: K, value: ProjectUpsertInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = projectUpsertSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      toast('error', 'Please fix the highlighted fields');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(projectId ? `/api/admin/projects/${projectId}` : '/api/admin/projects', {
        method: projectId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        toast('error', data.message ?? 'Could not save the project');
        return;
      }
      toast('success', projectId ? 'Project updated' : 'Project created');
      router.push('/admin/projects');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AdminPanel title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor="pe-title" required error={errors.title?.[0]}>
            <Input
              id="pe-title"
              value={form.title}
              onChange={(event) => {
                set('title', event.target.value);
                if (!slugTouched) set('slug', slugify(event.target.value));
              }}
              aria-invalid={!!errors.title}
            />
          </Field>
          <Field label="Slug" htmlFor="pe-slug" required error={errors.slug?.[0]} hint={`/projects/${form.slug || '…'}`}>
            <SlugInput
              id="pe-slug"
              value={form.slug}
              onChange={(next) => {
                setSlugTouched(true);
                set('slug', next);
              }}
              error={!!errors.slug}
            />
          </Field>
          <Field label="Tagline" htmlFor="pe-tagline" required error={errors.tagline?.[0]} className="sm:col-span-2">
            <Input id="pe-tagline" value={form.tagline} onChange={(event) => set('tagline', event.target.value)} aria-invalid={!!errors.tagline} />
          </Field>
          <Field label="Description" htmlFor="pe-description" required error={errors.description?.[0]} className="sm:col-span-2">
            <Textarea id="pe-description" rows={4} value={form.description} onChange={(event) => set('description', event.target.value)} aria-invalid={!!errors.description} />
          </Field>
          <Field label="Category" htmlFor="pe-category" error={errors.category?.[0]}>
            <Select id="pe-category" value={form.category} onChange={(event) => set('category', event.target.value as ProjectUpsertInput['category'])}>
              {projectCategories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Client / project type" htmlFor="pe-client" error={errors.clientType?.[0]}>
            <Input id="pe-client" value={form.clientType ?? ''} onChange={(event) => set('clientType', event.target.value)} placeholder='e.g. "Client project — logistics"' />
          </Field>
          <Field label="Year" htmlFor="pe-year" error={errors.year?.[0]}>
            <Input id="pe-year" type="number" value={form.year ?? ''} onChange={(event) => set('year', event.target.value ? Number(event.target.value) : null)} />
          </Field>
          <Field label="Sort order" htmlFor="pe-sort" error={errors.sortOrder?.[0]} hint="Lower numbers appear first.">
            <Input id="pe-sort" type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', Number(event.target.value))} />
          </Field>
          <Field label="Status" htmlFor="pe-status" error={errors.status?.[0]}>
            <Select id="pe-status" value={form.status} onChange={(event) => set('status', event.target.value as ProjectUpsertInput['status'])}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <div className="flex items-end gap-6 pb-1">
            <Toggle id="pe-featured" checked={form.featured} onChange={(next) => set('featured', next)} label="Featured" />
          </div>
          <Field label="Cover accent" htmlFor="pe-accent" className="sm:col-span-2">
            <AccentPicker value={form.accent} onChange={(next) => set('accent', next)} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Links & stack">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Live URL" htmlFor="pe-live" error={errors.liveUrl?.[0]}>
            <Input id="pe-live" value={form.liveUrl ?? ''} onChange={(event) => set('liveUrl', event.target.value)} placeholder="https://…" />
          </Field>
          <Field label="GitHub URL" htmlFor="pe-github" error={errors.githubUrl?.[0]}>
            <Input id="pe-github" value={form.githubUrl ?? ''} onChange={(event) => set('githubUrl', event.target.value)} placeholder="https://github.com/…" />
          </Field>
          <Field label="Technology stack" htmlFor="pe-stack" error={errors.stack?.[0]} className="sm:col-span-2" hint="Enter or comma to add.">
            <StringListInput id="pe-stack" value={form.stack} onChange={(next) => set('stack', next)} placeholder="Next.js, PostgreSQL, Docker…" />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Case study — problem & solution">
        <div className="grid gap-5">
          <Field label="The problem" htmlFor="pe-problem" error={errors.problem?.[0]}>
            <Textarea id="pe-problem" rows={4} value={form.problem ?? ''} onChange={(event) => set('problem', event.target.value)} />
          </Field>
          <Field label="The solution" htmlFor="pe-solution" error={errors.solution?.[0]}>
            <Textarea id="pe-solution" rows={4} value={form.solution ?? ''} onChange={(event) => set('solution', event.target.value)} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Architecture">
        <div className="grid gap-5 sm:grid-cols-2">
          {(['frontend', 'backend', 'database', 'infrastructure', 'services'] as const).map((layer) => (
            <Field key={layer} label={layer.charAt(0).toUpperCase() + layer.slice(1)} htmlFor={`pe-arch-${layer}`}>
              <StringListInput
                id={`pe-arch-${layer}`}
                value={form.architecture[layer]}
                onChange={(next) => set('architecture', { ...form.architecture, [layer]: next })}
                placeholder="Add items…"
                max={10}
              />
            </Field>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Challenges & solutions">
        <RowsEditor
          rows={form.challenges}
          onChange={(next) => set('challenges', next)}
          makeRow={() => ({ title: '', challenge: '', solution: '' })}
          addLabel="Add challenge"
          max={8}
          renderRow={(row, update, index) => (
            <div className="grid gap-3">
              <Field label={`Challenge ${index + 1} — title`} htmlFor={`pe-ch-title-${index}`}>
                <Input id={`pe-ch-title-${index}`} value={row.title} onChange={(event) => update({ title: event.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="The challenge" htmlFor={`pe-ch-c-${index}`}>
                  <Textarea id={`pe-ch-c-${index}`} rows={3} value={row.challenge} onChange={(event) => update({ challenge: event.target.value })} />
                </Field>
                <Field label="The solution" htmlFor={`pe-ch-s-${index}`}>
                  <Textarea id={`pe-ch-s-${index}`} rows={3} value={row.solution} onChange={(event) => update({ solution: event.target.value })} />
                </Field>
              </div>
            </div>
          )}
        />
        {errors.challenges && <p className="mt-2 text-[0.78rem] text-rose">{errors.challenges[0]}</p>}
      </AdminPanel>

      <AdminPanel title="Results">
        <RowsEditor
          rows={form.results}
          onChange={(next) => set('results', next)}
          makeRow={() => ({ value: '', metric: '', description: '' })}
          addLabel="Add result metric"
          max={8}
          renderRow={(row, update, index) => (
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <Field label="Value" htmlFor={`pe-r-v-${index}`} hint='e.g. "+34%"'>
                <Input id={`pe-r-v-${index}`} value={row.value} onChange={(event) => update({ value: event.target.value })} />
              </Field>
              <div className="grid gap-3">
                <Field label="Metric" htmlFor={`pe-r-m-${index}`} hint='e.g. "checkout conversion"'>
                  <Input id={`pe-r-m-${index}`} value={row.metric} onChange={(event) => update({ metric: event.target.value })} />
                </Field>
                <Field label="Description" htmlFor={`pe-r-d-${index}`}>
                  <Input id={`pe-r-d-${index}`} value={row.description ?? ''} onChange={(event) => update({ description: event.target.value })} />
                </Field>
              </div>
            </div>
          )}
        />
      </AdminPanel>

      <AdminPanel title="Gallery">
        <RowsEditor
          rows={form.gallery}
          onChange={(next) => set('gallery', next)}
          makeRow={() => ({ title: '', description: '' })}
          addLabel="Add gallery item"
          max={10}
          renderRow={(row, update, index) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title" htmlFor={`pe-g-t-${index}`}>
                <Input id={`pe-g-t-${index}`} value={row.title} onChange={(event) => update({ title: event.target.value })} />
              </Field>
              <Field label="Caption" htmlFor={`pe-g-d-${index}`}>
                <Input id={`pe-g-d-${index}`} value={row.description ?? ''} onChange={(event) => update({ description: event.target.value })} />
              </Field>
            </div>
          )}
        />
      </AdminPanel>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" loading={saving} className="shadow-[var(--shadow-soft)]">
          <Save className="size-4" aria-hidden />
          {saving ? 'Saving…' : projectId ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
