'use client';

import { CheckCircle2, Clock3, Sparkles, TrendingUp } from 'lucide-react';
import type { ZenithPanelArgs } from '../../../lib/generative-ui/schemas/static';
import { cn } from '../../../lib/utils';
import { MetricTile } from './MetricTile';

const toneStyles = {
  neutral: {
    accent: 'bg-[#4ECDC4]',
    border: 'border-[#4ECDC4]/35',
    surface: 'bg-[#4ECDC4]/10',
    label: 'Neutral',
  },
  positive: {
    accent: 'bg-emerald-500',
    border: 'border-emerald-500/35',
    surface: 'bg-emerald-500/10',
    label: 'Positive',
  },
  warning: {
    accent: 'bg-amber-500',
    border: 'border-amber-500/35',
    surface: 'bg-amber-500/10',
    label: 'Watch',
  },
};

export function ZenithPanel({
  title,
  summary,
  tone,
  metrics,
  nextActions,
  status,
}: ZenithPanelArgs & { status: string }) {
  const styles = toneStyles[tone];
  const isLoading = status === 'inProgress' || status === 'executing';

  return (
    <div className={cn('my-3 w-full max-w-2xl rounded-lg border bg-bg p-4', styles.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white',
              styles.accent,
            )}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-text-primary">{title}</h3>
              <span
                className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', styles.surface)}
              >
                {styles.label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{summary}</p>
          </div>
        </div>
        <div className="shrink-0 text-text-secondary">
          {isLoading ? (
            <Clock3 className="h-4 w-4 animate-pulse" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </div>
      </div>

      {metrics.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {metrics.map((metric) => (
            <MetricTile key={`${metric.label}-${metric.value}`} metric={metric} />
          ))}
        </div>
      ) : null}

      {nextActions.length > 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-sidebar-bg p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Next Actions</span>
          </div>
          <ul className="mt-2 space-y-2">
            {nextActions.map((action) => (
              <li key={action} className="flex gap-2 text-sm leading-relaxed text-text-primary">
                <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', styles.accent)} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
