import { getPostBySlug } from '@/lib/content';
import { ogImage, OG_SIZE } from '@/lib/og';

export const alt = 'Article cover';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  return ogImage({
    eyebrow: post ? `Blog · ${post.category}` : 'Blog',
    title: post?.title ?? 'Article',
    subtitle: post ? `${post.readingTime} min read` : undefined,
  });
}
