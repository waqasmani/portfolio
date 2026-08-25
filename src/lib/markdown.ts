import 'server-only';
import { Marked, type Token, type Tokens } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';
import { slugify } from '@/lib/utils';

/**
 * Server-side markdown rendering for blog articles.
 *
 * - Syntax highlighting runs on the server via shiki (dual light/dark theme
 *   using CSS variables) — zero highlighting JavaScript ships to the client.
 * - Headings get stable ids + anchor links; a table of contents is extracted
 *   in the same pass.
 * - Raw HTML embedded in markdown is escaped: articles are markdown-only,
 *   which removes the XSS surface entirely.
 */

const LANGS = [
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'bash', 'shell', 'sql',
  'css', 'html', 'yaml', 'dockerfile', 'nginx', 'toml', 'prisma', 'diff',
  'markdown', 'python',
] as const;

const THEMES = { light: 'github-light', dark: 'github-dark-default' } as const;

const store = globalThis as unknown as { __shiki?: Promise<Highlighter> };

function getHighlighter(): Promise<Highlighter> {
  return (store.__shiki ??= createHighlighter({
    themes: [THEMES.light, THEMES.dark],
    langs: [...LANGS],
  }));
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocEntry[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighter();
  const loadedLangs = new Set(highlighter.getLoadedLanguages());
  const toc: TocEntry[] = [];
  const usedIds = new Map<string, number>();

  const uniqueId = (text: string): string => {
    const base = slugify(stripInlineMarkdown(text)) || 'section';
    const seen = usedIds.get(base) ?? 0;
    usedIds.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };

  const marked = new Marked({
    gfm: true,
    breaks: false,
    async: true,
    walkTokens(token: Token) {
      if (token.type === 'code') {
        const codeToken = token as Tokens.Code & { highlighted?: string };
        const lang = (codeToken.lang ?? '').trim().split(/\s+/)[0].toLowerCase();
        const safeLang = loadedLangs.has(lang) ? lang : 'text';
        const highlighted = highlighter.codeToHtml(codeToken.text, {
          lang: safeLang,
          themes: THEMES,
          defaultColor: false,
        });
        codeToken.highlighted = `<figure class="code-block" data-lang="${escapeHtml(
          lang || 'text'
        )}">${highlighted}</figure>`;
      }
    },
    renderer: {
      code(token) {
        return (token as Tokens.Code & { highlighted?: string }).highlighted ?? '';
      },
      heading({ tokens, depth }) {
        const inline = this.parser.parseInline(tokens);
        const raw = tokens.map((t) => ('raw' in t ? t.raw : '')).join('');
        if (depth === 2 || depth === 3) {
          const id = uniqueId(raw);
          toc.push({ id, text: stripInlineMarkdown(raw), level: depth });
          return `<h${depth} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to section">#</a>${inline}</h${depth}>\n`;
        }
        return `<h${depth}>${inline}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const inline = this.parser.parseInline(tokens);
        const isExternal = /^https?:\/\//.test(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${externalAttrs}>${inline}</a>`;
      },
      image({ href, title, text }) {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" decoding="async" />`;
      },
      // Escape raw HTML: articles are markdown-only by policy.
      html(token) {
        return escapeHtml('raw' in token ? String(token.raw) : '');
      },
    },
  });

  const html = await marked.parse(markdown);
  return { html, toc };
}

/** Estimated reading time in minutes (~200 wpm). */
export function estimateReadingTime(markdown: string): number {
  const words = markdown.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** First ~N characters of plain text, for previews/description fallbacks. */
export function markdownExcerpt(markdown: string, length = 200): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}
