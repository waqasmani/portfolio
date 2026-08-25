'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, PenLine, Save } from 'lucide-react';
import { z } from 'zod';
import { postUpsertSchema, type PostUpsertInput } from '@/lib/schemas';
import { blogCategories } from '@/config/site';
import { cn, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { AdminPanel } from '@/components/admin/ui';
import { AccentPicker, SlugInput, StringListInput, Toggle } from '@/components/admin/editor-inputs';

type FieldErrors = Partial<Record<string, string[]>>;

const emptyPost: PostUpsertInput = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  category: blogCategories[0],
  tags: [],
  accent: 'indigo',
  status: 'DRAFT',
  featured: false,
  seoTitle: '',
  seoDescription: '',
  scheduledFor: null,
};

export function PostEditor({ postId, initial }: { postId?: string; initial?: PostUpsertInput }) {
  const [form, setForm] = useState<PostUpsertInput>(initial ?? emptyPost);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const set = <K extends keyof PostUpsertInput>(key: K, value: PostUpsertInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function openPreview() {
    setTab('preview');
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: form.content }),
      });
      const data = await response.json().catch(() => ({}));
      setPreviewHtml(response.ok ? data.html : '<p>Preview failed.</p>');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = postUpsertSchema.safeParse({
      ...form,
      scheduledFor:
        form.status === 'SCHEDULED' && form.scheduledFor
          ? new Date(form.scheduledFor).toISOString()
          : null,
    });
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      toast('error', 'Please fix the highlighted fields');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(postId ? `/api/admin/posts/${postId}` : '/api/admin/posts', {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        toast('error', data.message ?? 'Could not save the article');
        return;
      }
      toast('success', postId ? 'Article updated' : 'Article created');
      router.push('/admin/blog');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AdminPanel title="Article">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor="be-title" required error={errors.title?.[0]} className="sm:col-span-2">
            <Input
              id="be-title"
              value={form.title}
              onChange={(event) => {
                set('title', event.target.value);
                if (!slugTouched) set('slug', slugify(event.target.value));
              }}
              aria-invalid={!!errors.title}
            />
          </Field>
          <Field label="Slug" htmlFor="be-slug" required error={errors.slug?.[0]} hint={`/blog/${form.slug || '…'}`}>
            <SlugInput
              id="be-slug"
              value={form.slug}
              onChange={(next) => {
                setSlugTouched(true);
                set('slug', next);
              }}
              error={!!errors.slug}
            />
          </Field>
          <Field label="Category" htmlFor="be-category" error={errors.category?.[0]}>
            <Select id="be-category" value={form.category} onChange={(event) => set('category', event.target.value)}>
              {blogCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </Field>
          <Field label="Excerpt" htmlFor="be-excerpt" required error={errors.excerpt?.[0]} className="sm:col-span-2" hint="Shown on cards and in search results.">
            <Textarea id="be-excerpt" rows={2} value={form.excerpt} onChange={(event) => set('excerpt', event.target.value)} aria-invalid={!!errors.excerpt} maxLength={400} />
          </Field>
          <Field label="Tags" htmlFor="be-tags" error={errors.tags?.[0]}>
            <StringListInput id="be-tags" value={form.tags} onChange={(next) => set('tags', next)} placeholder="Next.js, Performance…" max={10} />
          </Field>
          <Field label="Cover accent" htmlFor="be-accent">
            <AccentPicker value={form.accent} onChange={(next) => set('accent', next)} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Content (Markdown)"
        actions={
          <div className="flex rounded-full border border-line bg-bg-raised p-0.5" role="tablist" aria-label="Editor mode">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'write'}
              onClick={() => setTab('write')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-medium transition-colors',
                tab === 'write' ? 'bg-panel-strong text-ink' : 'text-muted hover:text-ink'
              )}
            >
              <PenLine className="size-3.5" aria-hidden /> Write
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'preview'}
              onClick={openPreview}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-medium transition-colors',
                tab === 'preview' ? 'bg-panel-strong text-ink' : 'text-muted hover:text-ink'
              )}
            >
              <Eye className="size-3.5" aria-hidden /> Preview
            </button>
          </div>
        }
      >
        {tab === 'write' ? (
          <>
            <Textarea
              value={form.content}
              onChange={(event) => set('content', event.target.value)}
              rows={22}
              aria-label="Article content in Markdown"
              aria-invalid={!!errors.content}
              placeholder={'## Heading\n\nWrite in Markdown. Code blocks get syntax highlighting:\n\n```ts\nconst hello = "world";\n```'}
              className="font-mono text-[0.84rem] leading-relaxed"
            />
            {errors.content && <p className="mt-2 text-[0.78rem] text-rose">{errors.content[0]}</p>}
            <p className="mt-2 text-[0.72rem] text-faint">
              {form.content.split(/\s+/).filter(Boolean).length} words · headings become the table of
              contents · raw HTML is escaped
            </p>
          </>
        ) : previewLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-faint" />
          </div>
        ) : (
          <div className="prose-article" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </AdminPanel>

      <AdminPanel title="Publishing & SEO">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="be-status">
            <Select id="be-status" value={form.status} onChange={(event) => set('status', event.target.value as PostUpsertInput['status'])}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          {form.status === 'SCHEDULED' && (
            <Field label="Publish at" htmlFor="be-schedule" error={errors.scheduledFor?.[0]}>
              <Input
                id="be-schedule"
                type="datetime-local"
                value={form.scheduledFor ? form.scheduledFor.slice(0, 16) : ''}
                onChange={(event) => set('scheduledFor', event.target.value)}
              />
            </Field>
          )}
          <div className="flex items-end pb-1">
            <Toggle id="be-featured" checked={form.featured} onChange={(next) => set('featured', next)} label="Featured article" />
          </div>
          <Field label="SEO title" htmlFor="be-seo-title" error={errors.seoTitle?.[0]} className="sm:col-span-2" hint="Defaults to the article title.">
            <Input id="be-seo-title" value={form.seoTitle ?? ''} onChange={(event) => set('seoTitle', event.target.value)} maxLength={160} />
          </Field>
          <Field label="SEO description" htmlFor="be-seo-desc" error={errors.seoDescription?.[0]} className="sm:col-span-2" hint="Defaults to the excerpt.">
            <Textarea id="be-seo-desc" rows={2} value={form.seoDescription ?? ''} onChange={(event) => set('seoDescription', event.target.value)} maxLength={300} />
          </Field>
        </div>
      </AdminPanel>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" loading={saving} className="shadow-[var(--shadow-soft)]">
          <Save className="size-4" aria-hidden />
          {saving ? 'Saving…' : postId ? 'Save changes' : 'Create article'}
        </Button>
      </div>
    </form>
  );
}
