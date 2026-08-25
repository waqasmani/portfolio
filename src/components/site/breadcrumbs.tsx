import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { siteUrl } from '@/config/site';
import { JsonLd } from '@/components/site/json-ld';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail with BreadcrumbList structured data. Named for its role
 * as the compact header used on detail pages.
 */
export function PageHeaderless({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'Home', href: '/' }, ...items];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.label,
            ...(crumb.href ? { item: `${siteUrl}${crumb.href}` } : {}),
          })),
        }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-[0.78rem] text-faint">
          {all.map((crumb, index) => {
            const isLast = index === all.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="flex items-center gap-1 transition-colors hover:text-ink"
                  >
                    {index === 0 && <Home className="size-3.5" aria-hidden />}
                    {index === 0 ? <span className="sr-only">{crumb.label}</span> : crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="max-w-[16rem] truncate text-muted">
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
