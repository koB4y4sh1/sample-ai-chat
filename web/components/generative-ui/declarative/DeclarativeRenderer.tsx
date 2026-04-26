'use client';

import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Circle,
  Clock3,
  GitCompare,
  ListChecks,
  Plane,
  Quote,
  ShoppingBag,
  Table2,
  Users,
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

const dashboardColors = ['#3b82f6', '#14b8a6', '#ec4899', '#f59e0b', '#8b5cf6'];

const statusToneClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (
    normalized.includes('paid') ||
    normalized.includes('on time') ||
    normalized.includes('ready')
  ) {
    return 'text-emerald-500';
  }
  if (
    normalized.includes('failed') ||
    normalized.includes('delayed') ||
    normalized.includes('risk')
  ) {
    return 'text-red-500';
  }
  if (normalized.includes('boarding') || normalized.includes('pending')) {
    return 'text-amber-500';
  }
  return 'text-text-secondary';
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

function FlightOptionsBlock({ block }: { block: Extract<UIBlock, { type: 'flight_options' }> }) {
  return (
    <section>
      <SectionTitle>{block.title ?? 'Flight options'}</SectionTitle>
      <div className="grid gap-3">
        {block.items.map((flight) => (
          <article
            key={flight.id ?? `${flight.airline}-${flight.flightNumber}`}
            className="overflow-hidden rounded-xl border border-border bg-sidebar-bg shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-4">
              <div className="flex min-w-0 items-center gap-3">
                {flight.airlineLogo ? (
                  <div
                    aria-hidden="true"
                    className="h-9 w-9 rounded-full border border-border bg-bg bg-cover bg-center"
                    style={{ backgroundImage: `url(${flight.airlineLogo})` }}
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4]">
                    <Plane className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {flight.airline}
                  </p>
                  <p className="text-xs text-text-secondary">{flight.flightNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-text-primary">{flight.price}</p>
                <p className="text-xs text-text-secondary">{flight.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
              <div>
                <p className="text-xl font-semibold text-text-primary">{flight.departureTime}</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{flight.origin}</p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs text-text-secondary">{flight.duration}</p>
                <div className="my-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                  <span className="h-px flex-1 bg-border" />
                  <Plane className="h-3.5 w-3.5 text-[#4ECDC4]" />
                  <span className="h-px flex-1 bg-border" />
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                </div>
                <p className={cn('text-xs font-medium', statusToneClass(flight.status))}>
                  {flight.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-text-primary">{flight.arrivalTime}</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{flight.destination}</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                className="h-10 w-full rounded-lg border border-border bg-bg text-sm font-semibold text-text-primary transition-colors hover:border-[#4ECDC4]/60"
              >
                Select
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SalesDashboardBlock({ block }: { block: Extract<UIBlock, { type: 'sales_dashboard' }> }) {
  const maxMonthlyValue = Math.max(...block.monthlyData.map((item) => item.value), 1);
  const donutGradient = block.regionData
    .reduce(
      (segments, item, index) => {
        const start = segments.offset;
        const end = start + item.value;
        return {
          offset: end,
          css: [
            ...segments.css,
            `${item.color ?? dashboardColors[index % dashboardColors.length]} ${start}% ${end}%`,
          ],
        };
      },
      { offset: 0, css: [] as string[] },
    )
    .css.join(', ');

  return (
    <section className="space-y-4 rounded-xl border border-border bg-sidebar-bg p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-text-primary">{block.title}</h4>
          {block.dateRange ? (
            <p className="mt-1 text-sm text-text-secondary">{block.dateRange}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-secondary">
          <Clock3 className="h-3.5 w-3.5" />
          Live snapshot
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {block.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-bg p-4">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{kpi.label}</p>
                {kpi.subtitle ? (
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{kpi.subtitle}</p>
                ) : null}
              </div>
              {kpi.trend === 'up' ? (
                <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
              ) : kpi.trend === 'down' ? (
                <ShoppingBag className="h-4 w-4 text-red-500" />
              ) : (
                <Users className="h-4 w-4 text-text-secondary" />
              )}
            </div>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold text-text-primary">{kpi.value}</p>
              {kpi.trendValue ? (
                <p
                  className={cn(
                    'text-xs font-medium',
                    kpi.trend === 'up'
                      ? 'text-emerald-500'
                      : kpi.trend === 'down'
                        ? 'text-red-500'
                        : 'text-text-secondary',
                  )}
                >
                  {kpi.trendValue}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-sm font-semibold text-text-primary">Revenue by region</p>
          <p className="mt-1 text-xs text-text-secondary">Share of total</p>
          <div className="mt-5 grid grid-cols-[150px_1fr] items-center gap-4">
            <div
              className="relative h-36 w-36 rounded-full"
              style={{ background: `conic-gradient(${donutGradient})` }}
            >
              <div className="absolute inset-10 rounded-full bg-bg" />
            </div>
            <div className="space-y-2">
              {block.regionData.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: item.color ?? dashboardColors[index % dashboardColors.length],
                      }}
                    />
                    <span className="truncate text-text-secondary">{item.label}</span>
                  </span>
                  <strong className="text-text-primary">{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-sm font-semibold text-text-primary">Monthly revenue</p>
          <p className="mt-1 text-xs text-text-secondary">Months in period</p>
          <div className="mt-5 flex h-36 items-end gap-3 border-b border-l border-border px-3">
            {block.monthlyData.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div
                  className="min-h-2 rounded-t-lg bg-[#14b8a6]"
                  style={{ height: `${Math.max(6, (item.value / maxMonthlyValue) * 100)}%` }}
                />
                <p className="text-center text-xs text-text-secondary">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {block.orders.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Recent orders</p>
            <p className="mt-1 text-xs text-text-secondary">Latest high-value activity</p>
          </div>
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Region</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {block.orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 text-text-primary">{order.id}</td>
                  <td className="px-4 py-3 text-text-primary">{order.customer}</td>
                  <td className="px-4 py-3 text-text-secondary">{order.region}</td>
                  <td className="px-4 py-3 text-text-primary">{order.total}</td>
                  <td className={cn('px-4 py-3 font-medium', statusToneClass(order.status))}>
                    {order.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
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
    case 'flight_options':
      return <FlightOptionsBlock block={block} />;
    case 'sales_funnel':
      return <SalesFunnelBlock block={block} />;
    case 'sales_dashboard':
      return <SalesDashboardBlock block={block} />;
  }
}

export function DeclarativeRenderer({ spec, status }: { spec: UISpec; status: string }) {
  const isLoading = status === 'inProgress' || status === 'executing';

  return (
    <div className="my-3 w-full max-w-4xl rounded-lg border border-border bg-bg p-4">
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
