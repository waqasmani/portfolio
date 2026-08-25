import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { ArrowRight, Clock3, Eye, Tag } from 'lucide-react';
import { developer, siteUrl } from '@/config/site';
import { getPostBySlug, getRelatedPosts, incrementPostViews } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';
import { formatDate, formatNumber } from '@/lib/utils';
import { PageHeaderless } from '@/components/site/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { CoverArt } from '@/components/ui/cover-art';
import { BlogCard } from '@/components/blog/blog-card';
import {
  CodeCopyButtons,
  ReadingProgress,
  ShareButtons,
  TableOfContents,
} from '@/components/blog/article-client';
import { JsonLd } from '@/components/site/json-ld';
import { buttonStyles } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface Params {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Article not found' };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `${siteUrl}/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author?.name ?? developer.name],
      tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  after(() => incrementPostViews(post.id));

  const [{ html, toc }, related] = await Promise.all([
    renderMarkdown(post.content),
    getRelatedPosts(post.id, post.category, post.tags),
  ]);

  const url = `${siteUrl}/blog/${post.slug}`;
  const authorName = post.author?.name ?? developer.name;

  return (
    <>
      <ReadingProgress />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          url,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: { '@type': 'Person', name: authorName, url: siteUrl },
          publisher: { '@type': 'Person', name: authorName },
          keywords: post.tags.join(', '),
          mainEntityOfPage: url,
          timeRequired: `PT${post.readingTime}M`,
        }}
      />

      {/* Article header */}
      <header className="noise relative overflow-hidden border-b border-line">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 65% at 50% 0%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 72%)',
          }}
        />
        <div className="shell relative max-w-4xl py-12 md:py-16">
          <PageHeaderless items={[{ label: 'Blog', href: '/blog' }, { label: post.title }]} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{post.category}</Badge>
            {post.tags.slice(0, 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          <h1 className="mt-5 text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl md:text-[2.9rem]">
            {post.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{post.excerpt}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={authorName} className="size-10" />
              <div>
                <p className="text-sm font-medium text-ink">{authorName}</p>
                <p className="font-mono text-[0.72rem] text-faint">
                  <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
              <Clock3 className="size-3.5" aria-hidden />
              {post.readingTime} min read
            </span>
            <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
              <Eye className="size-3.5" aria-hidden />
              {formatNumber(post.views)} reads
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="shell py-12 md:py-16">
        <div className="mx-auto grid max-w-4xl gap-12 lg:mx-0 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="mx-auto w-full max-w-3xl">
            {/* Cover */}
            <div className="mb-10 aspect-[21/9] overflow-hidden rounded-2xl border border-line">
              <CoverArt seed={post.slug} accent={post.accent} glyph={post.title[0]} />
            </div>

            <article
              id="article-body"
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <CodeCopyButtons />

            {/* Tags + share */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-line pt-7">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="size-4 text-faint" aria-hidden />
                {post.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <ShareButtons title={post.title} url={url} />
            </div>

            {/* Author box */}
            <aside className="mt-10 flex flex-col gap-5 rounded-2xl border border-line bg-panel p-6 sm:flex-row sm:items-center sm:p-7">
              <Avatar name={authorName} className="size-14 text-lg" />
              <div className="flex-1">
                <p className="font-semibold text-ink">{authorName}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {developer.title} — writing about the patterns and trade-offs behind production web
                  platforms. Available for select freelance projects.
                </p>
              </div>
              <Link href="/contact" className={buttonStyles('secondary', 'sm')}>
                Work with me
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </aside>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <TableOfContents toc={toc} />
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mx-auto mt-20 max-w-6xl">
            <h2 id="related-title" className="text-xl font-semibold tracking-tight text-ink">
              Keep reading
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <BlogCard key={item.id} post={item} className="h-full" />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
