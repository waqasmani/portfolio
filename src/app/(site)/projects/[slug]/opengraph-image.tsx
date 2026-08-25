import { projectCategoryLabel } from '@/config/site';
import { getProjectBySlug } from '@/lib/content';
import { ogImage, OG_SIZE } from '@/lib/og';

export const alt = 'Project case study';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  return ogImage({
    eyebrow: project ? `Case Study · ${projectCategoryLabel(project.category)}` : 'Case Study',
    title: project?.title ?? 'Project',
    subtitle: project?.tagline,
  });
}
