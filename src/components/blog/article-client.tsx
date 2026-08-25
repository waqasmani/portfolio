'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2, List } from 'lucide-react';
import type { TocEntry } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import { LinkedinIcon, XIcon } from '@/components/ui/social-icons';

// ---------------------------------------------------------------------------
// Reading progress bar
// ---------------------------------------------------------------------------

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const article = document.getElementById('article-body');
        if (!article) return;
        const rect = article.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        setProgress(total > 0 ? scrolled / total : 1);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-16 z-40 h-0.5 bg-transparent" aria-hidden>
      <div
        className="h-full origin-left"
        style={{ transform: `scaleX(${progress})`, background: 'var(--gradient-brand)' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table of contents with scroll-spy
// ---------------------------------------------------------------------------

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);

  useEffect(() => {
    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.16em] text-faint uppercase">
        <List className="size-3.5" aria-hidden />
        On this page
      </p>
      <ul className="mt-4 space-y-1 border-l border-line">
        {toc.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                'block border-l-2 py-1 pr-2 leading-snug transition-colors',
                entry.level === 3 ? 'pl-7 text-[0.78rem]' : 'pl-4 text-[0.82rem]',
                activeId === entry.id
                  ? 'border-accent font-medium text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              )}
              style={{ marginLeft: '-1px' }}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Copy buttons for code blocks (event delegation over the rendered article)
// ---------------------------------------------------------------------------

export function CodeCopyButtons() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const blocks = document.querySelectorAll<HTMLElement>('#article-body .code-block');
    blocks.forEach((block) => {
      if (block.querySelector('.copy-button')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.textContent = 'copy';
      button.addEventListener('click', async () => {
        const code = block.querySelector('pre')?.innerText ?? '';
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = 'copied ✓';
          button.classList.add('copied');
          setTimeout(() => {
            button.textContent = 'copy';
            button.classList.remove('copied');
          }, 1800);
        } catch {
          button.textContent = 'failed';
          setTimeout(() => {
            button.textContent = 'copy';
          }, 1500);
        }
      });
      block.appendChild(button);
    });
  }, []);

  return null;
}

// ---------------------------------------------------------------------------
// Share buttons
// ---------------------------------------------------------------------------

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const share = (base: string) => {
    window.open(base, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 font-mono text-[0.68rem] tracking-[0.14em] text-faint uppercase">
        Share
      </span>
      <button
        onClick={() =>
          share(`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`)
        }
        aria-label="Share on X"
        className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        <XIcon className="size-3.5" />
      </button>
      <button
        onClick={() =>
          share(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
        }
        aria-label="Share on LinkedIn"
        className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        <LinkedinIcon className="size-4" />
      </button>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // Clipboard unavailable — no-op.
          }
        }}
        aria-label="Copy link"
        className={cn(
          'flex size-9 items-center justify-center rounded-full border transition-colors',
          copied
            ? 'border-[color-mix(in_srgb,var(--emerald)_50%,transparent)] text-emerald'
            : 'border-line text-muted hover:border-line-strong hover:text-ink'
        )}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </button>
    </div>
  );
}
