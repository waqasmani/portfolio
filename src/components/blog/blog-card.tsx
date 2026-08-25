import Link from 'next/link';
import { ArrowUpRight, Clock3, Eye } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CoverArt } from '@/components/ui/cover-art';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export interface BlogCardPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  accent: string;
  readingTime: number;
  views: number;
  publishedAt: Date | null;
}

export function BlogCard({ post, className }: { post: BlogCardPost; className?: string }) {
  return (
    <SpotlightCard
      className={cn(
        'card-lift group relative flex flex-col rounded-2xl border border-line bg-panel',
        className
      )}
    >
      <div className="relative m-2 aspect-[16/9] overflow-hidden rounded-xl border border-line">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.045]">
          <CoverArt seed={post.slug} accent={post.accent} glyph={post.title[0]} />
        </div>
        <Badge tone="accent" className="absolute top-3 left-3 backdrop-blur-sm">
          {post.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5 pt-3">
        <p className="flex items-center gap-3 font-mono text-[0.7rem] text-faint">
          <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" aria-hidden />
            {post.readingTime} min read
          </span>
        </p>
        <h3 className="mt-2.5 text-[1.05rem] leading-snug font-semibold text-balance text-ink">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
          <span className="flex items-center gap-1.5 text-[0.75rem] text-faint">
            <Eye className="size-3.5" aria-hidden />
            {formatNumber(post.views)} reads
          </span>
          <span className="flex items-center gap-1 text-[0.8rem] font-medium text-accent">
            Read article
            <ArrowUpRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
}

/** Wide editorial card for the featured article. */
export function FeaturedBlogCard({ post }: { post: BlogCardPost }) {
  return (
    <SpotlightCard className="card-lift group relative overflow-hidden rounded-3xl border border-line bg-panel">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="relative m-2 aspect-[16/9] overflow-hidden rounded-2xl border border-line md:m-3 md:aspect-auto md:min-h-[20rem]">
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.035]">
            <CoverArt seed={post.slug} accent={post.accent} glyph={post.title[0]} />
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge tone="amber">Featured</Badge>
            <Badge tone="accent" className="backdrop-blur-sm">
              {post.category}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
          <p className="flex items-center gap-3 font-mono text-[0.72rem] text-faint">
            <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" aria-hidden />
              {post.readingTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" aria-hidden />
              {formatNumber(post.views)}
            </span>
          </p>
          <h3 className="mt-3 text-2xl leading-snug font-semibold tracking-tight text-balance text-ink sm:text-3xl">
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </h3>
          <p className="mt-3.5 leading-relaxed text-muted">{post.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-[0.9rem] font-medium text-accent">
            Read the article
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
}
