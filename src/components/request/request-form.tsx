'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  FileUp,
  Loader2,
  Paperclip,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { projectRequestSchema, type ProjectBrief } from '@/lib/schemas';
import { budgetRanges, requestCategories } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { BriefView } from '@/components/request/brief-view';
import { trackEvent } from '@/lib/track-client';
import { cn, formatBytes } from '@/lib/utils';

type FieldErrors = Partial<Record<string, string[]>>;

interface Attachment {
  key: string;
  name: string;
  size: number;
  type: string;
}

const technologyOptions = [
  'Next.js', 'React', 'Vue.js', 'Node.js', 'Fastify', 'Express',
  'PostgreSQL', 'MariaDB', 'MySQL', 'Redis', 'Prisma', 'Stripe',
  'Docker', 'Cloudflare',
] as const;

const priorities = [
  { value: 'LOW', label: 'Low', hint: 'Whenever it fits' },
  { value: 'NORMAL', label: 'Normal', hint: 'Standard scheduling' },
  { value: 'HIGH', label: 'High', hint: 'Prioritised start' },
  { value: 'URGENT', label: 'Urgent', hint: 'Time-critical' },
] as const;

const initialForm = {
  name: '',
  email: '',
  company: '',
  title: '',
  category: '' as string,
  budget: '' as string,
  deadline: '',
  description: '',
  website: '', // honeypot
};

export function RequestForm({ initialCategory }: { initialCategory?: string }) {
  const [form, setForm] = useState({ ...initialForm, category: initialCategory ?? '' });
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // AI assistant state
  const [idea, setIdea] = useState('');
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [briefEngine, setBriefEngine] = useState<'claude' | 'heuristic' | null>(null);
  const [briefAttached, setBriefAttached] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const set = (key: keyof typeof initialForm) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // -------------------------------------------------------------------------
  // AI assistant
  // -------------------------------------------------------------------------

  async function generateBrief() {
    if (idea.trim().length < 20) {
      toast('info', 'Describe your idea first', 'At least 20 characters so the assistant has something to work with.');
      return;
    }
    setGenerating(true);
    setBriefAttached(false);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast(
          'error',
          response.status === 429 ? 'Slow down a little' : 'Could not generate the brief',
          data.message ?? 'Please try again in a moment.'
        );
        return;
      }
      setBrief(data.brief);
      setBriefEngine(data.engine);
    } catch {
      toast('error', 'Network error', 'Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  }

  // -------------------------------------------------------------------------
  // Attachments
  // -------------------------------------------------------------------------

  async function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    if (attachments.length + files.length > 3) {
      toast('info', 'Up to 3 attachments', 'Remove one before adding more.');
      return;
    }

    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast('error', `"${file.name}" is too large`, 'The limit is 5 MB per file.');
        continue;
      }
      const body = new FormData();
      body.append('file', file);
      try {
        const response = await fetch('/api/uploads', { method: 'POST', body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast('error', `Could not upload "${file.name}"`, data.message);
          continue;
        }
        setAttachments((current) => [
          ...current,
          { key: data.key, name: data.name, size: data.size, type: data.type },
        ]);
      } catch {
        toast('error', `Could not upload "${file.name}"`, 'Network error — try again.');
      }
    }
    setUploading(false);
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const payload = {
      ...form,
      technologies,
      priority,
      attachments: attachments.map(({ name, size, type }) => ({ name, size, type })),
      aiBrief: briefAttached && brief ? brief : undefined,
    };

    const parsed = projectRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors(fieldErrors);
      toast('error', 'Please check the highlighted fields');
      document.getElementById('request-form-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          // Attachment storage keys ride along for the admin download view.
          attachments: attachments,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus('idle');
        if (response.status === 422 && data.errors) {
          setErrors(data.errors);
          toast('error', 'Please check the highlighted fields');
        } else if (response.status === 429) {
          toast('error', 'Too many attempts', 'Give it a minute and try again.');
        } else {
          toast('error', 'Could not submit the request', data.message ?? 'Please try again.');
        }
        return;
      }
      setStatus('success');
      trackEvent('project_request_submitted');
    } catch {
      setStatus('idle');
      toast('error', 'Network error', 'Check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex min-h-[28rem] flex-col items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--emerald)_35%,transparent)] bg-[color-mix(in_srgb,var(--emerald)_6%,transparent)] p-10 text-center"
        role="status"
      >
        <motion.div
          initial={reduceMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
        >
          <CheckCircle2 className="size-14 text-emerald" aria-hidden />
        </motion.div>
        <h3 className="mt-5 text-xl font-semibold text-ink">Request received</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Thanks, {form.name.split(' ')[0]} — “{form.title}” is in my review queue
          {briefAttached ? ' with the AI brief attached' : ''}. You&apos;ll hear from me personally,
          usually within one business day.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8" id="request-form-top">
      {/* ------------------------------------------------------------------ */}
      {/* AI Project Assistant                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="AI project assistant"
        className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]">
            <Bot className="size-4.5 text-accent" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-[0.95rem] font-semibold text-ink">AI Project Assistant</h2>
            <p className="text-[0.75rem] text-muted">
              Optional — turn a rough idea into a structured brief before you submit.
            </p>
          </div>
          <Badge tone="accent">Optional</Badge>
        </div>

        <div className="space-y-4 p-5">
          <Textarea
            id="assistant-idea"
            aria-label="Describe your project idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder='e.g. "We run a small gym. Members book classes through WhatsApp messages and it&apos;s chaos — we need a booking system with a schedule, member logins, and payment for class packs."'
            rows={4}
            maxLength={2000}
            disabled={generating}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.72rem] text-faint">{idea.length}/2000 · no pricing, just structure</p>
            <div className="flex gap-2">
              {brief && (
                <Button type="button" variant="ghost" size="sm" onClick={generateBrief} disabled={generating}>
                  <RefreshCcw className="size-3.5" aria-hidden />
                  Regenerate
                </Button>
              )}
              <Button type="button" size="sm" onClick={generateBrief} loading={generating}>
                {generating ? 'Thinking…' : brief ? 'Update brief' : 'Generate brief'}
                {!generating && <Sparkles className="size-3.5" aria-hidden />}
              </Button>
            </div>
          </div>

          {generating && (
            <div className="space-y-3 rounded-xl border border-line bg-bg-raised p-5" aria-label="Generating brief">
              <Skeleton className="h-4 w-2/3" />
              <SkeletonText lines={3} />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          )}

          <AnimatePresence>
            {brief && !generating && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-line bg-bg-raised p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <p className="text-[0.82rem] font-semibold text-ink">Generated project brief</p>
                  <span className="font-mono text-[0.65rem] text-faint">
                    {briefEngine === 'claude' ? 'generated by Claude' : 'generated by the built-in analyzer'}
                  </span>
                </div>
                <BriefView brief={brief} />
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  {briefAttached ? (
                    <>
                      <span className="flex items-center gap-2 text-[0.85rem] font-medium text-emerald">
                        <CheckCircle2 className="size-4" aria-hidden />
                        Brief will be attached to your request
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setBriefAttached(false)}>
                        <X className="size-3.5" aria-hidden />
                        Detach
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setBriefAttached(true)}>
                      <Paperclip className="size-3.5" aria-hidden />
                      Attach brief to request
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Contact                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Your details" className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
        <h2 className="mb-5 text-[0.95rem] font-semibold text-ink">About you</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="req-name" required error={errors.name?.[0]}>
            <Input id="req-name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} placeholder="Jane Smith" />
          </Field>
          <Field label="Email" htmlFor="req-email" required error={errors.email?.[0]}>
            <Input id="req-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} placeholder="jane@company.com" />
          </Field>
          <Field label="Company" htmlFor="req-company" error={errors.company?.[0]} className="sm:col-span-2">
            <Input id="req-company" autoComplete="organization" value={form.company} onChange={set('company')} placeholder="Optional" />
          </Field>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Project                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Project details" className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
        <h2 className="mb-5 text-[0.95rem] font-semibold text-ink">The project</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Project title" htmlFor="req-title" required error={errors.title?.[0]} className="sm:col-span-2">
            <Input id="req-title" value={form.title} onChange={set('title')} aria-invalid={!!errors.title} placeholder='e.g. "Class booking system for our gym"' />
          </Field>
          <Field label="Category" htmlFor="req-category" required error={errors.category?.[0]}>
            <Select id="req-category" value={form.category} onChange={set('category')} aria-invalid={!!errors.category}>
              <option value="">Select…</option>
              {requestCategories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Budget range" htmlFor="req-budget" required error={errors.budget?.[0]}>
            <Select id="req-budget" value={form.budget} onChange={set('budget')} aria-invalid={!!errors.budget}>
              <option value="">Select…</option>
              {budgetRanges.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Deadline" htmlFor="req-deadline" error={errors.deadline?.[0]} hint="Rough is fine — “end of Q2”, “before June”, “flexible”." className="sm:col-span-2">
            <Input id="req-deadline" value={form.deadline} onChange={set('deadline')} placeholder="Flexible" />
          </Field>
        </div>

        {/* Priority */}
        <fieldset className="mt-6">
          <legend className="mb-2 text-[0.82rem] font-medium text-ink">Priority</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Priority">
            {priorities.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={priority === option.value}
                onClick={() => setPriority(option.value)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-all',
                  priority === option.value
                    ? 'border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                    : 'border-line bg-panel hover:border-line-strong'
                )}
              >
                <span className={cn('block text-[0.82rem] font-medium', priority === option.value ? 'text-accent' : 'text-ink')}>
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[0.68rem] text-faint">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Technologies */}
        <fieldset className="mt-6">
          <legend className="mb-1 text-[0.82rem] font-medium text-ink">Preferred technologies</legend>
          <p className="mb-2.5 text-[0.75rem] text-faint">
            Optional — leave empty for “whatever fits best”.
          </p>
          <div className="flex flex-wrap gap-2">
            {technologyOptions.map((tech) => {
              const selected = technologies.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setTechnologies((current) =>
                      selected ? current.filter((item) => item !== tech) : [...current, tech]
                    )
                  }
                  className={cn(
                    'rounded-full border px-3 py-1.5 font-mono text-[0.75rem] transition-all',
                    selected
                      ? 'border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
                      : 'border-line bg-panel text-muted hover:border-line-strong hover:text-ink'
                  )}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field
          label="Project description"
          htmlFor="req-description"
          required
          error={errors.description?.[0]}
          hint={`${form.description.length}/8000`}
          className="mt-6"
        >
          <Textarea
            id="req-description"
            rows={7}
            value={form.description}
            onChange={set('description')}
            aria-invalid={!!errors.description}
            maxLength={8000}
            placeholder="What are you trying to build, who uses it, and what does success look like? Existing systems, links, and constraints all help…"
          />
        </Field>

        {/* Attachments */}
        <div className="mt-6">
          <p className="mb-1 text-[0.82rem] font-medium text-ink">Attachments</p>
          <p className="mb-2.5 text-[0.75rem] text-faint">
            Up to 3 files, 5 MB each — specs, sketches, exports (PDF, images, docs, zip).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.zip,.doc,.docx,.csv"
            onChange={onFilesSelected}
            aria-label="Add attachments"
          />
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.key}
                className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised px-3.5 py-2.5"
              >
                <Paperclip className="size-4 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink">{attachment.name}</span>
                <span className="font-mono text-[0.68rem] text-faint">{formatBytes(attachment.size)}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((current) => current.filter((item) => item.key !== attachment.key))}
                  aria-label={`Remove ${attachment.name}`}
                  className="rounded-md p-1 text-faint transition-colors hover:text-rose"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {attachments.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-[0.82rem] text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FileUp className="size-4" aria-hidden />
                    Add files
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="req-website">Leave this field empty</label>
        <input id="req-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting…' : 'Submit project request'}
          {status !== 'submitting' && <Send className="size-4" aria-hidden />}
        </Button>
        {briefAttached && (
          <span className="flex items-center gap-1.5 text-[0.8rem] text-emerald">
            <Paperclip className="size-3.5" aria-hidden />
            AI brief attached
          </span>
        )}
      </div>
    </form>
  );
}
