'use client';

import { Gauge } from 'lucide-react';
import type { ZenithMetric } from '@/features/chat/schemas/static';

export function MetricTile({ metric }: { metric: ZenithMetric }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-sidebar-bg px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase text-text-secondary">
        <Gauge className="h-3.5 w-3.5" />
        <span className="truncate">{metric.label}</span>
      </div>
      <div className="mt-1 flex min-w-0 items-baseline gap-2">
        <span className="truncate text-lg font-semibold text-text-primary">{metric.value}</span>
        {metric.delta ? (
          <span className="truncate text-xs font-medium text-text-secondary">{metric.delta}</span>
        ) : null}
      </div>
    </div>
  );
}
