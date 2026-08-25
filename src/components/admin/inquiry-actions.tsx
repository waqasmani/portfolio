'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

const requestStatuses = ['NEW', 'REVIEWING', 'CONTACTED', 'PROPOSAL_SENT', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const messageStatuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];

function label(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Status dropdown that persists immediately. */
export function StatusSelect({
  id,
  status,
  kind,
}: {
  id: string;
  status: string;
  kind: 'request' | 'message';
}) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onChange(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    const endpoint = kind === 'request' ? `/api/admin/requests/${id}` : `/api/admin/messages/${id}`;
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) {
      setValue(previous);
      toast('error', 'Could not update status');
      return;
    }
    router.refresh();
  }

  const options = kind === 'request' ? requestStatuses : messageStatuses;
  return (
    <Select
      value={value}
      onChange={(event) => void onChange(event.target.value)}
      disabled={saving}
      aria-label="Status"
      className="h-9 w-40 py-1.5 text-[0.8rem]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {label(option)}
        </option>
      ))}
    </Select>
  );
}

/** Internal notes editor for a project request. */
export function NotesEditor({ id, notes }: { id: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? '');
  const [saving, setSaving] = useState(false);
  const [savedValue, setSavedValue] = useState(notes ?? '');
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    const response = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: undefined, notes: value }),
    }).catch(() => null);
    setSaving(false);
    if (response?.ok) {
      setSavedValue(value);
      toast('success', 'Notes saved');
    } else {
      toast('error', 'Could not save notes');
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={5}
        maxLength={4000}
        placeholder="Internal notes — never visible to the client…"
        aria-label="Internal notes"
      />
      <Button size="sm" variant="secondary" onClick={save} loading={saving} disabled={value === savedValue}>
        <Save className="size-3.5" aria-hidden />
        Save notes
      </Button>
    </div>
  );
}

/** Delete button with confirmation. */
export function DeleteButton({
  endpoint,
  redirectTo,
  children,
}: {
  endpoint: string;
  redirectTo?: string;
  children?: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onDelete() {
    setDeleting(true);
    const response = await fetch(endpoint, { method: 'DELETE' }).catch(() => null);
    setDeleting(false);
    if (response?.ok) {
      toast('success', 'Deleted');
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } else {
      toast('error', 'Could not delete');
    }
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-faint hover:text-rose">
        <Trash2 className="size-3.5" aria-hidden />
        {children ?? 'Delete'}
      </Button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-[0.78rem] text-muted">Sure?</span>
      <Button variant="danger" size="sm" onClick={onDelete} loading={deleting}>
        Yes, delete
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </span>
  );
}
