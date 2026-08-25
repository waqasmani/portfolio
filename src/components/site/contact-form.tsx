'use client';

import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Send } from 'lucide-react';
import { z } from 'zod';
import { contactSchema } from '@/lib/schemas';
import { budgetRanges, contactProjectTypes } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { trackEvent } from '@/lib/track-client';

type FieldErrors = Partial<Record<string, string[]>>;

const initialForm = {
  name: '',
  email: '',
  company: '',
  subject: '',
  projectType: '',
  budget: '',
  message: '',
  website: '', // honeypot
};

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const set = (key: keyof typeof initialForm) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
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
          toast('error', 'Could not send your message', data.message ?? 'Please try again.');
        }
        return;
      }

      setStatus('success');
      trackEvent('contact_submitted');
    } catch {
      setStatus('idle');
      toast('error', 'Network error', 'Check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex h-full min-h-96 flex-col items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--emerald)_35%,transparent)] bg-[color-mix(in_srgb,var(--emerald)_6%,transparent)] p-10 text-center"
        role="status"
      >
        <motion.div
          initial={reduceMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
        >
          <CheckCircle2 className="size-14 text-emerald" aria-hidden />
        </motion.div>
        <h3 className="mt-5 text-xl font-semibold text-ink">Message sent</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Thanks, {form.name.split(' ')[0]} — your message is in our inbox. Expect a personal reply within one
          business day.
        </p>
        <button
          onClick={() => {
            setForm(initialForm);
            setStatus('idle');
          }}
          className="mt-6 text-sm font-medium text-accent transition-colors hover:text-accent-strong"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name" required error={errors.name?.[0]}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            aria-invalid={!!errors.name}
            placeholder="Jane Smith"
          />
        </Field>
        <Field label="Email" htmlFor="contact-email" required error={errors.email?.[0]}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            aria-invalid={!!errors.email}
            placeholder="jane@company.com"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company" htmlFor="contact-company" error={errors.company?.[0]}>
          <Input
            id="contact-company"
            name="company"
            autoComplete="organization"
            value={form.company}
            onChange={set('company')}
            placeholder="Optional"
          />
        </Field>
        <Field label="Subject" htmlFor="contact-subject" required error={errors.subject?.[0]}>
          <Input
            id="contact-subject"
            name="subject"
            value={form.subject}
            onChange={set('subject')}
            aria-invalid={!!errors.subject}
            placeholder="What's this about?"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Project type" htmlFor="contact-type" error={errors.projectType?.[0]}>
          <Select id="contact-type" value={form.projectType} onChange={set('projectType')}>
            <option value="">Select…</option>
            {contactProjectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Budget range" htmlFor="contact-budget" error={errors.budget?.[0]}>
          <Select id="contact-budget" value={form.budget} onChange={set('budget')}>
            <option value="">Select…</option>
            {budgetRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Message"
        htmlFor="contact-message"
        required
        error={errors.message?.[0]}
        hint={`${form.message.length}/5000`}
      >
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          value={form.message}
          onChange={set('message')}
          aria-invalid={!!errors.message}
          placeholder="Tell us about the project — goals, timeline, anything you already know…"
          maxLength={5000}
        />
      </Field>

      {/* Honeypot — hidden from real users, irresistible to bots */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={set('website')}
        />
      </div>

      <Button type="submit" size="lg" loading={status === 'submitting'} className="w-full sm:w-auto">
        {status === 'submitting' ? 'Sending…' : 'Send message'}
        {status !== 'submitting' && <Send className="size-4" aria-hidden />}
      </Button>
    </form>
  );
}
