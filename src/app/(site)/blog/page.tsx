import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileSearch, Search } from 'lucide-react';
import { blogCategories } from '@/config/site';
import { getBlogCategoryCounts, getFeaturedPost, getPublishedPosts } from '@/lib/content';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/site/page-header';
import { BlogCard, FeaturedBlogCard } from '@/components/blog/blog-card';
import { Reveal } from '@/components/motion/reveal';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonStyles } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Engineering write-ups on Next.js, React, Node.js, PostgreSQL, DevOps, and AI development — practical patterns from production systems, not tutorials rehashed.',
  alternates: { canonical: '/blog' },
};

interface SearchParams {
  q?: string;
  category?: string;
  page?: string;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) || undefined;
  const category = blogCategories.includes(params.category as (typeof blogCategories)[number])
    ? params.category
    : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const filtering = Boolean(query || category);

  const [{ posts, total, totalPages }, featured, counts] = await Promise.all([
    getPublishedPosts({ page, perPage: 9, category, query }),
    getFeaturedPost(),
    getBlogCategoryCounts(),
  ]);

  const showFeatured = !filtering && page === 1 && featured;
  const gridPosts = showFeatured ? posts.filter((post) => post.slug !== featured.slug) : posts;

  const pageHref = (target: number) => {
    const search = new URLSearchParams();
    if (query) search.set('q', query);
    if (category) search.set('category', category);
    if (target > 1) search.set('page', String(target));
    const suffix = search.toString();
    return suffix ? `/blog?${suffix}` : '/blog';
  };

  return (
    <>
      <PageHeader
        eyebrow="Writing"
        title={
          <>
            Notes from <span className="text-gradient">production</span>
          </>
        }
        description="Patterns, post-mortems, and opinions from real systems — the article I wish existed when I hit the problem."
      >
        {/* Search */}
        <form action="/blog" className="mt-8 flex max-w-md items-center gap-2" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search articles…"
              aria-label="Search articles"
              className="w-full rounded-full border border-line bg-panel py-2.5 pr-4 pl-10 text-sm text-ink placeholder:text-faint focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:outline-none"
            />
          </div>
          <button type="submit" className={buttonStyles('secondary', 'sm')}>
            Search
          </button>
        </form>

        {/* Categories */}
        <nav aria-label="Blog categories" className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/blog"
            aria-current={!category ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition-all',
              !category
                ? 'border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
                : 'border-line bg-panel text-muted hover:border-line-strong hover:text-ink'
            )}
          >
            All
          </Link>
          {blogCategories.map((item) => {
            const count = counts.find((entry) => entry.category === item)?.count ?? 0;
            const active = category === item;
            return (
              <Link
                key={item}
                href={`/blog?category=${encodeURIComponent(item)}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition-all',
                  active
                    ? 'border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
                    : 'border-line bg-panel text-muted hover:border-line-strong hover:text-ink',
                  count === 0 && 'opacity-50'
                )}
              >
                {item}
                {count > 0 && <span className="ml-1.5 font-mono text-[0.68rem] text-faint">{count}</span>}
              </Link>
            );
          })}
        </nav>
      </PageHeader>

      <section className="shell py-14 md:py-20" aria-live="polite">
        {filtering && (
          <p className="mb-8 text-sm text-muted">
            {total === 0 ? 'No articles' : total === 1 ? '1 article' : `${total} articles`}
            {query ? (
              <>
                {' '}
                matching <span className="font-medium text-ink">“{query}”</span>
              </>
            ) : null}
            {category ? (
              <>
                {' '}
                in <span className="font-medium text-ink">{category}</span>
              </>
            ) : null}
            {' · '}
            <Link href="/blog" className="text-accent hover:text-accent-strong">
              Clear filters
            </Link>
          </p>
        )}

        {showFeatured && (
          <Reveal className="mb-8" y={26}>
            <FeaturedBlogCard post={featured} />
          </Reveal>
        )}

        {gridPosts.length === 0 && !showFeatured ? (
          <EmptyState
            icon={FileSearch}
            title="No articles found"
            description="Try a different search term or browse every article."
            action={
              <Link href="/blog" className={buttonStyles('secondary', 'sm')}>
                Show all articles
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post, index) => (
              <Reveal key={post.id} delay={Math.min(index, 5) * 0.06} className="h-full">
                <BlogCard post={post} className="h-full" />
              </Reveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            <Link
              href={pageHref(page - 1)}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={cn(
                buttonStyles('secondary', 'sm'),
                page <= 1 && 'pointer-events-none opacity-40'
              )}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Newer
            </Link>
            <span className="px-3 font-mono text-[0.78rem] text-faint">
              {page} / {totalPages}
            </span>
            <Link
              href={pageHref(page + 1)}
              aria-disabled={page >= totalPages}
              tabIndex={page >= totalPages ? -1 : undefined}
              className={cn(
                buttonStyles('secondary', 'sm'),
                page >= totalPages && 'pointer-events-none opacity-40'
              )}
            >
              Older
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </nav>
        )}
      </section>
    </>
  );
}
