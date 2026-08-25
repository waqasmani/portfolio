'use client';

import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/field';

/** Tag/chip list input: Enter or comma adds, click removes. */
export function StringListInput({
  value,
  onChange,
  placeholder,
  id,
  max = 20,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  id?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const items = draft
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && !value.includes(item));
    if (items.length > 0) onChange([...value, ...items].slice(0, max));
    setDraft('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-2 focus-within:border-[color-mix(in_srgb,var(--accent)_60%,transparent)]">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded-md border border-line bg-bg-raised px-2 py-0.5 font-mono text-[0.72rem] text-ink"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((existing) => existing !== item))}
              aria-label={`Remove ${item}`}
              className="text-faint hover:text-rose"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm text-ink placeholder:text-faint focus:outline-none"
        />
      </div>
    </div>
  );
}

/** Repeatable rows editor for arrays of objects. */
export function RowsEditor<T>({
  rows,
  onChange,
  makeRow,
  renderRow,
  addLabel,
  max = 10,
}: {
  rows: T[];
  onChange: (next: T[]) => void;
  makeRow: () => T;
  renderRow: (row: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  addLabel: string;
  max?: number;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="relative rounded-xl border border-line bg-bg-raised p-4">
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
            aria-label="Remove item"
            className="absolute top-2.5 right-2.5 rounded-md p-1 text-faint transition-colors hover:text-rose"
          >
            <X className="size-4" />
          </button>
          {renderRow(
            row,
            (patch) =>
              onChange(rows.map((existing, rowIndex) => (rowIndex === index ? { ...existing, ...patch } : existing))),
            index
          )}
        </div>
      ))}
      {rows.length < max && (
        <button
          type="button"
          onClick={() => onChange([...rows, makeRow()])}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-2.5 text-[0.82rem] text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          <Plus className="size-4" aria-hidden />
          {addLabel}
        </button>
      )}
    </div>
  );
}

const accents = ['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet'] as const;
const accentSwatches: Record<string, string> = {
  indigo: '#8b95ff',
  sky: '#5ec2f7',
  emerald: '#3ddba0',
  amber: '#ffc466',
  rose: '#ff7d9c',
  violet: '#b78cff',
};

/** Accent color picker for cover art. */
export function AccentPicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Accent color">
      {accents.map((accent) => (
        <button
          key={accent}
          type="button"
          role="radio"
          aria-checked={value === accent}
          aria-label={accent}
          title={accent}
          onClick={() => onChange(accent)}
          className={cn(
            'size-8 rounded-full border-2 transition-all',
            value === accent ? 'scale-110 border-ink' : 'border-transparent opacity-70 hover:opacity-100'
          )}
          style={{ background: accentSwatches[accent] }}
        />
      ))}
    </div>
  );
}

/** Labelled toggle switch. */
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full border transition-colors',
          checked
            ? 'border-transparent bg-accent'
            : 'border-line-strong bg-panel'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-4.5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
      <span className="text-[0.85rem] font-medium text-ink">{label}</span>
    </label>
  );
}

/** Auto-slug helper: mirrors a title into a slug until manually edited. */
export function SlugInput({
  value,
  onChange,
  id,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  error?: boolean;
}) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-\s]/g, '')
            .replace(/\s+/g, '-')
        )
      }
      aria-invalid={error || undefined}
      placeholder="url-friendly-slug"
      className="font-mono text-[0.82rem]"
    />
  );
}
