import { Cloud, Database, Layers, MonitorSmartphone, Server, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArchitectureData {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  infrastructure?: string[];
  services?: string[];
}

const flowLayers = [
  { key: 'frontend' as const, label: 'Frontend', icon: MonitorSmartphone, tone: 'var(--sky)' },
  { key: 'backend' as const, label: 'Backend', icon: Server, tone: 'var(--accent)' },
  { key: 'database' as const, label: 'Database', icon: Database, tone: 'var(--emerald)' },
];

function Chip({ children }: { children: string }) {
  return (
    <li className="rounded-md border border-line bg-bg-raised px-2.5 py-1 font-mono text-[0.72rem] text-muted">
      {children}
    </li>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <svg width="14" height="26" viewBox="0 0 14 26" fill="none" className="text-faint">
        <path d="M7 0v19" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="m2 19 5 6 5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/**
 * Clean layered system diagram: request flow down the left (frontend →
 * backend → database), with infrastructure and external services rails
 * alongside. Pure markup — crisp at every size, themed automatically.
 */
export function ArchitectureDiagram({ architecture }: { architecture: ArchitectureData }) {
  const layers = flowLayers.filter((layer) => (architecture[layer.key] ?? []).length > 0);
  const infrastructure = architecture.infrastructure ?? [];
  const services = architecture.services ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Request flow */}
      <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
        <p className="mb-5 flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.16em] text-faint uppercase">
          <Layers className="size-3.5" aria-hidden />
          Request flow
        </p>

        <div
          className={cn(
            'mx-auto mb-1 w-fit rounded-full border border-line bg-bg-raised px-4 py-1.5 font-mono text-[0.72rem] text-muted'
          )}
        >
          Client — browser / mobile
        </div>

        {layers.map((layer) => (
          <div key={layer.key}>
            <FlowArrow />
            <section
              aria-label={layer.label}
              className="rounded-xl border border-line bg-panel-strong p-4"
              style={{ borderLeft: `3px solid color-mix(in srgb, ${layer.tone} 70%, transparent)` }}
            >
              <h4 className="flex items-center gap-2 text-[0.85rem] font-semibold text-ink">
                <layer.icon className="size-4" style={{ color: layer.tone }} aria-hidden />
                {layer.label}
              </h4>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {(architecture[layer.key] ?? []).map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </ul>
            </section>
          </div>
        ))}
      </div>

      {/* Rails */}
      <div className="flex flex-col gap-6">
        <section
          aria-label="Infrastructure"
          className="flex-1 rounded-2xl border border-dashed border-line bg-panel p-5 sm:p-6"
        >
          <h4 className="flex items-center gap-2 text-[0.85rem] font-semibold text-ink">
            <Cloud className="size-4 text-amber" aria-hidden />
            Infrastructure
          </h4>
          <p className="mt-1 text-[0.75rem] text-faint">Where it runs</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {infrastructure.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </ul>
        </section>

        {services.length > 0 && (
          <section
            aria-label="External services"
            className="flex-1 rounded-2xl border border-dashed border-line bg-panel p-5 sm:p-6"
          >
            <h4 className="flex items-center gap-2 text-[0.85rem] font-semibold text-ink">
              <Workflow className="size-4 text-violet" aria-hidden />
              APIs & Services
            </h4>
            <p className="mt-1 text-[0.75rem] text-faint">What it integrates</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {services.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
