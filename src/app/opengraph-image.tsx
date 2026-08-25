import { developer } from '@/config/site';
import { ogImage, OG_SIZE } from '@/lib/og';

export const alt = `${developer.name} — ${developer.title}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OpengraphImage() {
  return ogImage({
    eyebrow: 'Portfolio',
    title: 'Fast, scalable & beautiful web applications.',
    subtitle: `${developer.title} — SaaS platforms, e-commerce, custom CRMs, and APIs that hold up under real traffic.`,
  });
}
