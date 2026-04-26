'use client';

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Circle,
  GitCompare,
  ListChecks,
  Plane,
  Quote,
  Table2,
} from 'lucide-react';
import type { UIBlock, UISpec } from '../../../lib/generative-ui/schemas/declarative';
import { cn } from '../../../lib/utils';

const calloutStyles = {
  neutral: 'border-[#4ECDC4]/35 bg-[#4ECDC4]/10',
  positive: 'border-emerald-500/35 bg-emerald-500/10',
  warning: 'border-amber-500/35 bg-amber-500/10',
};

const toneDotStyles = {
  neutral: 'bg-[#4ECDC4]',
  positive: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

const toneBorderStyles = {
  neutral: 'border-[#4ECDC4]/35 bg-[#4ECDC4]/10',
  positive: 'border-emerald-500/35 bg-emerald-500/10',
  warning: 'border-amber-500/35 bg-amber-500/10',
};

function SectionTitle({ children }: { children?: string }) {
  if (!children) {
    return null;
  }

  return <h4 className="mb-2 text-xs font-semibold uppercase text-text-secondary">{children}</h4>;
}

function MetricGridBlock({ block }: { block: Extract<UIBlock, { type: 'metric_grid' }> }) {
  const items = Array.isArray(block.items) ? block.items : [];

  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="min-w-0 rounded-lg border border-border bg-sidebar-bg px-3 py-2"
          >
            <p className="truncate text-[11px] font-medium uppercase text-text-secondary">
              {item.label}
            </p>
            <div className="mt-1 flex min-w-0 items-baseline gap-2">
              <span className="truncate text-lg font-semibold text-text-primary">{item.value}</span>
              {item.delta ? (
                <span className="truncate text-xs text-text-secondary">{item.delta}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ListBlock({ block }: { block: Extract<UIBlock, { type: 'list' }> }) {
  const ListTag = block.ordered ? 'ol' : 'ul';
  const items = Array.isArray(block.items) ? block.items : [];

  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <ListTag className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-text-primary">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-[#4ECDC4]" />
            <span>{item}</span>
          </li>
        ))}
      </ListTag>
    </section>
  );
}

function TableBlock({ block }: { block: Extract<UIBlock, { type: 'table' }> }) {
  const columns = Array.isArray(block.columns) ? block.columns : [];
  const rows = Array.isArray(block.rows) ? block.rows : [];

  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead className="bg-sidebar-bg text-xs uppercase text-text-secondary">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-border px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join('-')}>
                {columns.map((column, columnIndex) => (
                  <td key={column} className="border-b border-border px-3 py-2">
                    {row[columnIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalloutBlock({ block }: { block: Extract<UIBlock, { type: 'callout' }> }) {
  const tone = block.tone ?? 'neutral';

  return (
    <section className={cn('rounded-lg border p-3', calloutStyles[tone])}>
      {block.title ? (
        <h4 className="mb-1 text-sm font-semibold text-text-primary">{block.title}</h4>
      ) : null}
      <p className="text-sm leading-relaxed text-text-secondary">{block.body ?? ''}</p>
    </section>
  );
}

function ActionsBlock({ block }: { block: Extract<UIBlock, { type: 'actions' }> }) {
  const actions = Array.isArray(block.actions) ? block.actions : [];

  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.label}
            className="flex gap-2 rounded-lg border border-border bg-sidebar-bg px-3 py-2"
          >
            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{action.label}</p>
              {action.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {action.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TextBlock({ block }: { block: Extract<UIBlock, { type: 'text' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <p className="text-sm leading-relaxed text-text-secondary">{block.body}</p>
    </section>
  );
}

function DividerBlock({ block }: { block: Extract<UIBlock, { type: 'divider' }> }) {
  return (
    <section className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      {block.title ? (
        <span className="shrink-0 text-xs font-medium uppercase text-text-secondary">
          {block.title}
        </span>
      ) : null}
      <div className="h-px flex-1 bg-border" />
    </section>
  );
}

function KeyValueBlock({ block }: { block: Extract<UIBlock, { type: 'key_value' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {block.items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-lg border border-border p-3">
            <p className="text-[11px] font-medium uppercase text-text-secondary">{item.label}</p>
            <p className="mt-1 text-base font-semibold text-text-primary">{item.value}</p>
            {item.description ? (
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgressBlock({ block }: { block: Extract<UIBlock, { type: 'progress' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-3">
        {block.items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-text-primary">{item.label}</span>
              <span className="text-text-secondary">{item.value ?? `${item.percent}%`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sidebar-bg">
              <div
                className={toneDotStyles[item.tone ?? 'neutral']}
                style={{ height: '100%', width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChecklistBlock({ block }: { block: Extract<UIBlock, { type: 'checklist' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-2">
        {block.items.map((item) => (
          <div key={item.label} className="flex gap-2 rounded-lg border border-border p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ECDC4]" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              ) : null}
              {item.status ? (
                <p className="mt-1 text-[11px] uppercase text-text-secondary">{item.status}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineBlock({ block }: { block: Extract<UIBlock, { type: 'timeline' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-0">
        {block.items.map((item) => (
          <div key={item.label} className="grid grid-cols-[18px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <Circle className="h-3 w-3 fill-[#4ECDC4] text-[#4ECDC4]" />
              <div className="mt-1 h-full w-px bg-border" />
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-text-primary">{item.label}</p>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              ) : null}
              {item.status ? (
                <span className="mt-2 inline-flex rounded-md border border-border px-2 py-0.5 text-[11px] text-text-secondary">
                  {item.status}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonBlock({ block }: { block: Extract<UIBlock, { type: 'comparison' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-2">
        {block.items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <GitCompare className="h-4 w-4 text-[#4ECDC4]" />
              <span>{item.label}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-md bg-sidebar-bg p-2 text-sm">{item.from}</div>
              <ArrowRight className="hidden h-4 w-4 text-text-secondary sm:block" />
              <div className="rounded-md bg-sidebar-bg p-2 text-sm">{item.to}</div>
            </div>
            {item.description ? (
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function RiskMatrixBlock({ block }: { block: Extract<UIBlock, { type: 'risk_matrix' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {block.items.map((item) => (
          <div
            key={item.label}
            className={cn('rounded-lg border p-3', toneBorderStyles[item.tone ?? 'neutral'])}
          >
            <p className="text-sm font-semibold text-text-primary">{item.label}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-text-secondary">
              <span>Likely: {item.likelihood ?? '-'}</span>
              <span>Impact: {item.impact ?? '-'}</span>
              <span>Score: {item.score ?? '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionBlock({ block }: { block: Extract<UIBlock, { type: 'decision' }> }) {
  const tone = block.tone ?? 'neutral';

  return (
    <section className={cn('rounded-lg border p-4', toneBorderStyles[tone])}>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4ECDC4]" />
        <div>
          <p className="text-lg font-semibold text-text-primary">{block.verdict}</p>
          {block.body ? (
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{block.body}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TabsBlock({ block }: { block: Extract<UIBlock, { type: 'tabs' }> }) {
  const [first, ...rest] = block.items;

  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="rounded-lg border border-border">
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {block.items.map((item) => (
            <span
              key={item.label}
              className="rounded-md bg-sidebar-bg px-2 py-1 text-xs font-medium text-text-secondary"
            >
              {item.label}
            </span>
          ))}
        </div>
        {first ? (
          <div className="p-3">
            <p className="text-sm font-semibold text-text-primary">{first.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{first.body}</p>
          </div>
        ) : null}
        {rest.length > 0 ? (
          <p className="border-t border-border px-3 py-2 text-xs text-text-secondary">
            {rest.length} more tab{rest.length === 1 ? '' : 's'} available in this schema.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AccordionBlock({ block }: { block: Extract<UIBlock, { type: 'accordion' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="divide-y divide-border rounded-lg border border-border">
        {block.items.map((item) => (
          <details key={item.label} className="group p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text-primary">
              {item.label}
              <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function QuoteBlock({ block }: { block: Extract<UIBlock, { type: 'quote' }> }) {
  return (
    <section className="rounded-lg border border-border bg-sidebar-bg p-4">
      <Quote className="h-4 w-4 text-[#4ECDC4]" />
      <p className="mt-2 text-sm leading-relaxed text-text-primary">{block.body}</p>
      {block.subtitle ? <p className="mt-2 text-xs text-text-secondary">{block.subtitle}</p> : null}
    </section>
  );
}

function StatusStripBlock({ block }: { block: Extract<UIBlock, { type: 'status_strip' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {block.items.map((item) => (
          <span
            key={`${item.label}-${item.value}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span className={cn('h-2 w-2 rounded-full', toneDotStyles[item.tone ?? 'neutral'])} />
            <span className="text-text-secondary">{item.label}</span>
            <strong className="text-text-primary">{item.value}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}

function FlightCardBlock({ block }: { block: Extract<UIBlock, { type: 'flight_card' }> }) {
  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <SectionTitle>{block.title}</SectionTitle>
          <p className="text-xs uppercase text-text-secondary">{block.status ?? 'Scheduled'}</p>
        </div>
        <Plane className="h-5 w-5 text-[#4ECDC4]" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <p className="text-lg font-semibold text-text-primary">{block.from}</p>
        <ArrowRight className="h-4 w-4 text-text-secondary" />
        <p className="text-right text-lg font-semibold text-text-primary">{block.to}</p>
      </div>
      {block.body ? (
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{block.body}</p>
      ) : null}
    </section>
  );
}

function SalesFunnelBlock({ block }: { block: Extract<UIBlock, { type: 'sales_funnel' }> }) {
  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-2">
        {block.items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-text-primary">{item.label}</span>
              <span className="text-text-secondary">{item.value}</span>
            </div>
            {typeof item.percent === 'number' ? (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sidebar-bg">
                <div className="h-full bg-[#4ECDC4]" style={{ width: `${item.percent}%` }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function BlockRenderer({ block }: { block: UIBlock }) {
  switch (block.type) {
    case 'metric_grid':
      return <MetricGridBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'actions':
      return <ActionsBlock block={block} />;
    case 'text':
      return <TextBlock block={block} />;
    case 'divider':
      return <DividerBlock block={block} />;
    case 'key_value':
      return <KeyValueBlock block={block} />;
    case 'progress':
      return <ProgressBlock block={block} />;
    case 'checklist':
      return <ChecklistBlock block={block} />;
    case 'timeline':
      return <TimelineBlock block={block} />;
    case 'comparison':
      return <ComparisonBlock block={block} />;
    case 'risk_matrix':
      return <RiskMatrixBlock block={block} />;
    case 'decision':
      return <DecisionBlock block={block} />;
    case 'tabs':
      return <TabsBlock block={block} />;
    case 'accordion':
      return <AccordionBlock block={block} />;
    case 'quote':
      return <QuoteBlock block={block} />;
    case 'status_strip':
      return <StatusStripBlock block={block} />;
    case 'flight_card':
      return <FlightCardBlock block={block} />;
    case 'sales_funnel':
      return <SalesFunnelBlock block={block} />;
  }
}

export function DeclarativeRenderer({ spec, status }: { spec: UISpec; status: string }) {
  const isLoading = status === 'inProgress' || status === 'executing';

  return (
    <div className="my-3 w-full max-w-2xl rounded-lg border border-border bg-bg p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 shrink-0 text-[#4ECDC4]" />
            <h3 className="truncate text-base font-semibold text-text-primary">{spec.title}</h3>
          </div>
          {spec.summary ? (
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{spec.summary}</p>
          ) : null}
        </div>
        {isLoading ? (
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        ) : (
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        )}
      </div>
      <div className="space-y-4">
        {spec.blocks.map((block) => (
          <BlockRenderer key={JSON.stringify(block)} block={block} />
        ))}
      </div>
    </div>
  );
}
