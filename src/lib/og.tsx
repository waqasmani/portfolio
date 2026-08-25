import { ImageResponse } from 'next/og';
import { developer, siteUrl } from '@/config/site';

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared Open Graph card template: dark, gridded, gradient-accented. */
export function ogImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}): ImageResponse {
  const host = siteUrl.replace(/^https?:\/\//, '');
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#05070d',
          backgroundImage:
            'radial-gradient(55% 55% at 8% 0%, rgba(139,149,255,0.22), transparent 70%), radial-gradient(45% 45% at 95% 15%, rgba(94,194,247,0.16), transparent 70%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
          color: '#e9edf5',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: 'linear-gradient(90deg, #8b95ff, #5ec2f7)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 24,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#8b95ff',
            }}
          >
            <div style={{ width: 34, height: 2, background: '#8b95ff', display: 'flex' }} />
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: title.length > 60 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -2,
              maxWidth: 1020,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 28, color: '#9aa5bb', maxWidth: 940, lineHeight: 1.45, display: 'flex' }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #8b95ff, #5ec2f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#0b1020',
            }}
          >
            CF
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28, fontWeight: 700, display: 'flex' }}>{developer.name}</div>
            <div style={{ fontSize: 22, color: '#9aa5bb', display: 'flex' }}>
              {developer.title} · {host}
            </div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
