'use client';

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Clock3,
  Code2,
  FileText,
  GitCompare,
  Link2,
  ListChecks,
  Paperclip,
  Plane,
  Quote,
  Radio,
  ShieldCheck,
  ShoppingBag,
  Table2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { UIBlock, UISpec } from '@/features/chat/schemas/declarative';
import { cn } from '@/lib/utils';

type SubmitInteraction = (
  content: string,
  options?: {
    toolCallId?: string;
    interactionKey?: string;
  },
) => Promise<void> | void;

type InteractiveBlockProps<T extends UIBlock> = {
  block: T;
  onSubmitInteraction?: SubmitInteraction;
  toolCallId?: string;
  interactionDisabled?: boolean;
  selectedInteractionKeys?: Set<string>;
};

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

const statusPillClass = (status?: string) => {
  const normalized = status?.toLowerCase() ?? '';
  if (
    normalized.includes('done') ||
    normalized.includes('complete') ||
    normalized.includes('approved') ||
    normalized.includes('resolved') ||
    normalized.includes('完了') ||
    normalized.includes('承認')
  ) {
    return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400';
  }
  if (
    normalized.includes('blocked') ||
    normalized.includes('failed') ||
    normalized.includes('error') ||
    normalized.includes('critical') ||
    normalized.includes('失敗') ||
    normalized.includes('エラー')
  ) {
    return 'border-red-500/35 bg-red-500/10 text-red-400';
  }
  if (
    normalized.includes('pending') ||
    normalized.includes('review') ||
    normalized.includes('warning') ||
    normalized.includes('確認') ||
    normalized.includes('注意')
  ) {
    return 'border-amber-500/35 bg-amber-500/10 text-amber-400';
  }
  return 'border-border bg-sidebar-bg text-text-secondary';
};

const confirmationActionVariant = (
  action: Extract<UIBlock, { type: 'confirmation_panel' }>['actions'][number],
  index: number,
) => {
  if (action.variant) {
    return action.variant;
  }

  const normalized = action.label.toLowerCase();
  if (
    normalized.includes('cancel') ||
    normalized.includes('reject') ||
    normalized.includes('delete') ||
    normalized.includes('abort')
  ) {
    return 'danger';
  }

  return index === 0 ? 'primary' : 'secondary';
};

const confirmationActionClass = (
  action: Extract<UIBlock, { type: 'confirmation_panel' }>['actions'][number],
  index: number,
) => {
  const variant = confirmationActionVariant(action, index);
  if (variant === 'danger') {
    return 'border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/15';
  }
  if (variant === 'primary') {
    return 'border-[#4ECDC4]/50 bg-[#4ECDC4]/15 text-text-primary hover:bg-[#4ECDC4]/20';
  }
  return 'border-border bg-bg text-text-secondary hover:text-text-primary';
};

const buildSelectedInteractionKey = (toolCallId: string | undefined, interactionKey: string) =>
  toolCallId ? `${toolCallId}:${interactionKey}` : interactionKey;

const isInteractionSelected = (
  selectedInteractionKeys: Set<string> | undefined,
  toolCallId: string | undefined,
  interactionKey: string,
) => selectedInteractionKeys?.has(buildSelectedInteractionKey(toolCallId, interactionKey)) ?? false;

const interactiveButtonClass = ({
  enabled,
  selected,
  activeClass,
  inactiveClass = 'border-border bg-bg text-text-secondary hover:text-text-primary',
}: {
  enabled: boolean;
  selected: boolean;
  activeClass: string;
  inactiveClass?: string;
}) => {
  if (enabled) {
    return activeClass;
  }

  if (selected) {
    return 'cursor-not-allowed border-[#4ECDC4]/35 bg-[#4ECDC4]/10 text-[#4ECDC4] opacity-80';
  }

  return `${inactiveClass} cursor-not-allowed opacity-45 grayscale hover:border-border hover:text-text-secondary`;
};

const submitInteraction = (
  onSubmitInteraction: SubmitInteraction | undefined,
  content: string,
  options?: {
    toolCallId?: string;
    interactionKey?: string;
    disabled?: boolean;
  },
) => {
  if (options?.disabled) {
    return;
  }

  if (!onSubmitInteraction) {
    return;
  }

  void onSubmitInteraction(content, {
    toolCallId: options?.toolCallId,
    interactionKey: options?.interactionKey,
  });
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

function ActionsBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'actions' }>>) {
  const actions = Array.isArray(block.actions) ? block.actions : [];
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;

  return (
    <section>
      <SectionTitle>{block.title}</SectionTitle>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={!enabled}
            onClick={() => {
              const interactionKey = `action:${action.label}`;
              submitInteraction(
                onSubmitInteraction,
                [
                  'User selected a generated action.',
                  `Action group: ${block.title ?? 'Actions'}`,
                  `Selected action: ${action.label}`,
                  action.description ? `Action detail: ${action.description}` : '',
                ]
                  .filter(Boolean)
                  .join('\n'),
                { toolCallId, interactionKey, disabled: !enabled },
              );
            }}
            className={cn(
              'flex w-full gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
              interactiveButtonClass({
                enabled,
                selected: isInteractionSelected(
                  selectedInteractionKeys,
                  toolCallId,
                  `action:${action.label}`,
                ),
                activeClass: 'border-border bg-sidebar-bg hover:border-[#4ECDC4]/60',
                inactiveClass: 'border-border bg-sidebar-bg text-text-secondary',
              }),
            )}
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
          </button>
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

function AnswerCardBlock({ block }: { block: Extract<UIBlock, { type: 'answer_card' }> }) {
  const tone = block.tone ?? 'neutral';
  const items = Array.isArray(block.items) ? block.items : [];

  return (
    <section className={cn('rounded-xl border p-4', toneBorderStyles[tone])}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4ECDC4]/30 bg-[#4ECDC4]/10 text-[#4ECDC4]">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {block.title ? (
            <h4 className="text-sm font-semibold text-text-primary">{block.title}</h4>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{block.body}</p>
          {items.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-bg p-3">
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SourceListBlock({ block }: { block: Extract<UIBlock, { type: 'source_list' }> }) {
  return (
    <section>
      <SectionTitle>{block.title ?? 'Sources'}</SectionTitle>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {block.items.map((item) => (
          <div key={`${item.label}-${item.path ?? item.url ?? ''}`} className="flex gap-3 p-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4ECDC4]/10 text-[#4ECDC4]">
              {item.url ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.label}</p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {item.path ?? item.url ?? 'Referenced context'}
                {item.line ? `:${item.line}` : ''}
              </p>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskPlanBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'task_plan' }>>) {
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;

  return (
    <section>
      <SectionTitle>{block.title ?? 'Task plan'}</SectionTitle>
      <div className="space-y-2">
        {block.items.map((item, index) => (
          <div
            key={`${item.label}-${item.status ?? ''}-${item.owner ?? ''}`}
            className="grid grid-cols-[28px_1fr] gap-3"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#4ECDC4]/35 bg-[#4ECDC4]/10 text-xs font-semibold text-[#4ECDC4]">
                {index + 1}
              </div>
              {index < block.items.length - 1 ? (
                <div className="mt-1 h-full w-px bg-border" />
              ) : null}
            </div>
            <div className="min-w-0 rounded-lg border border-border bg-sidebar-bg p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                {item.status ? (
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                      statusPillClass(item.status),
                    )}
                  >
                    {item.status}
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              ) : null}
              {item.owner ? (
                <p className="mt-2 text-[11px] uppercase text-text-secondary">
                  Owner: {item.owner}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!enabled}
                className={cn(
                  'mt-3 min-h-8 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                  interactiveButtonClass({
                    enabled,
                    selected: isInteractionSelected(
                      selectedInteractionKeys,
                      toolCallId,
                      `task:${item.label}`,
                    ),
                    activeClass:
                      'border-border bg-bg text-text-secondary hover:border-[#4ECDC4]/60 hover:text-text-primary',
                  }),
                )}
                onClick={() => {
                  const interactionKey = `task:${item.label}`;
                  submitInteraction(
                    onSubmitInteraction,
                    [
                      'User selected a task from a generated plan.',
                      `Plan: ${block.title ?? 'Task plan'}`,
                      `Task: ${item.label}`,
                      item.description ? `Task detail: ${item.description}` : '',
                      item.status ? `Status: ${item.status}` : '',
                      item.owner ? `Owner: ${item.owner}` : '',
                    ]
                      .filter(Boolean)
                      .join('\n'),
                    { toolCallId, interactionKey, disabled: !enabled },
                  );
                }}
              >
                Continue with this
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConfirmationPanelBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'confirmation_panel' }>>) {
  const tone = block.tone ?? 'neutral';
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;
  const actions =
    block.actions.length > 0
      ? block.actions
      : [
          { label: 'Approve', variant: 'primary' as const },
          { label: 'Cancel', variant: 'danger' as const },
        ];

  return (
    <section className={cn('overflow-hidden rounded-xl border', toneBorderStyles[tone])}>
      <div className="flex items-start gap-3 border-b border-border/70 bg-bg/35 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#4ECDC4]/30 bg-[#4ECDC4]/10 text-[#4ECDC4]">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium uppercase text-amber-300">
              Approval required
            </span>
          </div>
          {block.title ? (
            <h4 className="text-base font-semibold text-text-primary">{block.title}</h4>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{block.body}</p>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {actions.map((action, index) => (
          <div key={action.label} className="rounded-lg border border-border bg-bg p-3">
            <button
              type="button"
              disabled={!enabled}
              onClick={() => {
                const interactionKey = `confirmation:${action.label}`;
                submitInteraction(
                  onSubmitInteraction,
                  [
                    'User responded to a confirmation panel.',
                    `Panel: ${block.title ?? 'Confirmation'}`,
                    `Selected action: ${action.label}`,
                    action.description ? `Action detail: ${action.description}` : '',
                    `Original request: ${block.body}`,
                  ]
                    .filter(Boolean)
                    .join('\n'),
                  { toolCallId, interactionKey, disabled: !enabled },
                );
              }}
              className={cn(
                'min-h-10 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                interactiveButtonClass({
                  enabled,
                  selected: isInteractionSelected(
                    selectedInteractionKeys,
                    toolCallId,
                    `confirmation:${action.label}`,
                  ),
                  activeClass: confirmationActionClass(action, index),
                  inactiveClass: 'border-border bg-bg text-text-secondary',
                }),
              )}
            >
              {action.label}
            </button>
            {action.description ? (
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                {action.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function FormFillBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'form_fill' }>>) {
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;
  const interactionKey = `form:${block.title ?? 'Form'}`;
  const selected = isInteractionSelected(selectedInteractionKeys, toolCallId, interactionKey);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(block.items.map((item) => [item.label, item.value ?? ''])),
  );

  const submitForm = () => {
    const lines = block.items.map((item) => {
      const value = values[item.label]?.trim() || item.placeholder || '';
      return `- ${item.label}: ${value}`;
    });

    submitInteraction(
      onSubmitInteraction,
      [`User submitted a generated form.`, `Form: ${block.title ?? 'Form'}`, ...lines].join('\n'),
      { toolCallId, interactionKey, disabled: !enabled },
    );
  };

  return (
    <section>
      <SectionTitle>{block.title ?? 'Form'}</SectionTitle>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <div
              key={item.label}
              className="block rounded-xl border border-border bg-sidebar-bg p-3"
            >
              <span className="flex items-center justify-between gap-2 text-xs font-medium uppercase text-text-secondary">
                {item.label}
                {item.required ? <span className="text-amber-400">Required</span> : null}
              </span>
              {item.inputType === 'textarea' ? (
                <textarea
                  aria-label={item.label}
                  className="mt-2 min-h-24 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-[#4ECDC4]/70 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={!enabled}
                  placeholder={item.placeholder ?? item.inputType ?? ''}
                  required={item.required}
                  value={values[item.label] ?? ''}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [item.label]: event.target.value }))
                  }
                />
              ) : (
                <input
                  aria-label={item.label}
                  className="mt-2 h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-[#4ECDC4]/70 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={!enabled}
                  placeholder={item.placeholder ?? item.inputType ?? ''}
                  required={item.required}
                  type={
                    item.inputType === 'number' || item.inputType === 'email'
                      ? item.inputType
                      : 'text'
                  }
                  value={values[item.label] ?? ''}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [item.label]: event.target.value }))
                  }
                />
              )}
              {item.status ? (
                <p className="mt-2 text-xs text-text-secondary">{item.status}</p>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={!enabled}
          className={cn(
            'min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
            interactiveButtonClass({
              enabled,
              selected,
              activeClass:
                'border-[#4ECDC4]/50 bg-[#4ECDC4]/15 text-text-primary hover:bg-[#4ECDC4]/20',
            }),
          )}
        >
          Submit
        </button>
      </form>
    </section>
  );
}

function ChoicePickerBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'choice_picker' }>>) {
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;

  return (
    <section>
      <SectionTitle>{block.title ?? 'Choose an option'}</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {block.items.map((item, index) => (
          <button
            key={item.label}
            type="button"
            disabled={!enabled}
            onClick={() => {
              const interactionKey = `choice:${item.label}`;
              submitInteraction(
                onSubmitInteraction,
                [
                  'User selected an option from a generated choice picker.',
                  `Picker: ${block.title ?? 'Choice picker'}`,
                  `Selected option: ${item.label}`,
                  item.description ? `Option detail: ${item.description}` : '',
                  item.status ? `Status: ${item.status}` : '',
                ]
                  .filter(Boolean)
                  .join('\n'),
                { toolCallId, interactionKey, disabled: !enabled },
              );
            }}
            className={cn(
              'min-h-[92px] rounded-xl border p-3 text-left transition-colors hover:border-[#4ECDC4]/60',
              interactiveButtonClass({
                enabled,
                selected: isInteractionSelected(
                  selectedInteractionKeys,
                  toolCallId,
                  `choice:${item.label}`,
                ),
                activeClass:
                  index === 0
                    ? toneBorderStyles[item.tone ?? 'neutral']
                    : 'border-border bg-sidebar-bg',
                inactiveClass: 'border-border bg-sidebar-bg text-text-secondary',
              }),
            )}
          >
            <div className="flex items-start gap-3">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 text-[#4ECDC4]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                {item.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                ) : null}
                {item.status ? (
                  <span
                    className={cn(
                      'mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px]',
                      statusPillClass(item.status),
                    )}
                  >
                    {item.status}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function DiffPreviewBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'diff_preview' }>>) {
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;

  return (
    <section>
      <SectionTitle>{block.title ?? 'Diff preview'}</SectionTitle>
      <div className="space-y-3">
        {block.items.map((item) => (
          <article key={item.label} className="overflow-hidden rounded-xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-sidebar-bg px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text-primary">
                <Code2 className="h-4 w-4 shrink-0 text-[#4ECDC4]" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.language ? (
                <span className="text-xs text-text-secondary">{item.language}</span>
              ) : null}
            </div>
            {item.description ? (
              <p className="border-b border-border px-3 py-2 text-xs text-text-secondary">
                {item.description}
              </p>
            ) : null}
            <div className="grid gap-px bg-border md:grid-cols-2">
              <pre className="min-h-[96px] overflow-x-auto bg-bg p-3 text-xs leading-relaxed text-red-300">
                <code className="whitespace-pre-wrap">{item.before}</code>
              </pre>
              <pre className="min-h-[96px] overflow-x-auto bg-bg p-3 text-xs leading-relaxed text-emerald-300">
                <code className="whitespace-pre-wrap">{item.after}</code>
              </pre>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border bg-sidebar-bg px-3 py-3">
              <button
                type="button"
                disabled={!enabled}
                className={cn(
                  'min-h-9 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                  interactiveButtonClass({
                    enabled,
                    selected: isInteractionSelected(
                      selectedInteractionKeys,
                      toolCallId,
                      `diff:use:${item.label}`,
                    ),
                    activeClass:
                      'border-[#4ECDC4]/50 bg-[#4ECDC4]/15 text-text-primary hover:bg-[#4ECDC4]/20',
                  }),
                )}
                onClick={() => {
                  const interactionKey = `diff:use:${item.label}`;
                  submitInteraction(
                    onSubmitInteraction,
                    [
                      'User accepted a generated diff preview.',
                      `Diff: ${item.label}`,
                      'Use the revised content below.',
                      item.after,
                    ].join('\n'),
                    { toolCallId, interactionKey, disabled: !enabled },
                  );
                }}
              >
                Use revised
              </button>
              <button
                type="button"
                disabled={!enabled}
                className={cn(
                  'min-h-9 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                  interactiveButtonClass({
                    enabled,
                    selected: isInteractionSelected(
                      selectedInteractionKeys,
                      toolCallId,
                      `diff:revise:${item.label}`,
                    ),
                    activeClass: 'border-border bg-bg text-text-secondary hover:text-text-primary',
                  }),
                )}
                onClick={() => {
                  const interactionKey = `diff:revise:${item.label}`;
                  submitInteraction(
                    onSubmitInteraction,
                    [
                      'User requested another revision for a generated diff preview.',
                      `Diff: ${item.label}`,
                      'Please revise again while preserving the original intent.',
                      `Current revised content:\n${item.after}`,
                    ].join('\n'),
                    { toolCallId, interactionKey, disabled: !enabled },
                  );
                }}
              >
                Revise again
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ErrorDiagnosisBlock({ block }: { block: Extract<UIBlock, { type: 'error_diagnosis' }> }) {
  return (
    <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
      <div className="mb-3 flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div>
          <SectionTitle>{block.title ?? 'Diagnosis'}</SectionTitle>
          {block.body ? (
            <p className="text-sm leading-relaxed text-text-secondary">{block.body}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        {block.items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-bg p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary">{item.label}</p>
              {item.severity ? (
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px]',
                    statusPillClass(item.severity),
                  )}
                >
                  {item.severity}
                </span>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{item.description}</p>
            ) : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.cause ? (
                <div className="rounded-lg bg-sidebar-bg p-2">
                  <p className="text-[11px] uppercase text-text-secondary">Cause</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-primary">{item.cause}</p>
                </div>
              ) : null}
              {item.reproduction ? (
                <div className="rounded-lg bg-sidebar-bg p-2">
                  <p className="text-[11px] uppercase text-text-secondary">Reproduction</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-primary">
                    {item.reproduction}
                  </p>
                </div>
              ) : null}
              {item.fix ? (
                <div className="rounded-lg bg-sidebar-bg p-2">
                  <p className="text-[11px] uppercase text-text-secondary">Fix</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-primary">{item.fix}</p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FileAttachmentCardBlock({
  block,
}: {
  block: Extract<UIBlock, { type: 'file_attachment_card' }>;
}) {
  return (
    <section>
      <SectionTitle>{block.title ?? 'Attachments'}</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {block.items.map((item) => (
          <div
            key={`${item.label}-${item.filePath ?? ''}`}
            className="rounded-xl border border-border bg-sidebar-bg p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4ECDC4]/10 text-[#4ECDC4]">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {item.fileName ?? item.label}
                </p>
                {item.filePath ? (
                  <p className="mt-0.5 truncate text-xs text-text-secondary">{item.filePath}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-secondary">
                  {item.mimeType ? <span>{item.mimeType}</span> : null}
                  {item.size ? <span>{item.size}</span> : null}
                  {item.status ? (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5',
                        statusPillClass(item.status),
                      )}
                    >
                      {item.status}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgressTrackerBlock({
  block,
}: {
  block: Extract<UIBlock, { type: 'progress_tracker' }>;
}) {
  return (
    <section>
      <SectionTitle>{block.title ?? 'Progress'}</SectionTitle>
      <div className="grid gap-3">
        {block.items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-sidebar-bg p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                {item.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold text-text-primary">
                {item.percent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
              <div
                className={toneDotStyles[item.tone ?? 'neutral']}
                style={{ height: '100%', width: `${item.percent}%` }}
              />
            </div>
            {item.status ? <p className="mt-2 text-xs text-text-secondary">{item.status}</p> : null}
          </div>
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

function FlightOptionsBlock({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: InteractiveBlockProps<Extract<UIBlock, { type: 'flight_options' }>>) {
  const enabled = Boolean(onSubmitInteraction) && !interactionDisabled;

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
                disabled={!enabled}
                onClick={() => {
                  const interactionKey = `flight:${flight.id ?? `${flight.airline}-${flight.flightNumber}`}`;
                  submitInteraction(
                    onSubmitInteraction,
                    [
                      'User selected a flight option.',
                      `Flight: ${flight.airline} ${flight.flightNumber}`,
                      `Route: ${flight.origin} to ${flight.destination}`,
                      `Departure: ${flight.date} ${flight.departureTime}`,
                      `Arrival: ${flight.arrivalTime}`,
                      `Price: ${flight.price}`,
                      `Status: ${flight.status}`,
                    ].join('\n'),
                    { toolCallId, interactionKey, disabled: !enabled },
                  );
                }}
                className={cn(
                  'h-10 w-full rounded-lg border text-sm font-semibold transition-colors',
                  interactiveButtonClass({
                    enabled,
                    selected: isInteractionSelected(
                      selectedInteractionKeys,
                      toolCallId,
                      `flight:${flight.id ?? `${flight.airline}-${flight.flightNumber}`}`,
                    ),
                    activeClass: 'border-border bg-bg text-text-primary hover:border-[#4ECDC4]/60',
                  }),
                )}
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

function BlockRenderer({
  block,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled,
  selectedInteractionKeys,
}: {
  block: UIBlock;
  onSubmitInteraction?: SubmitInteraction;
  toolCallId?: string;
  interactionDisabled?: boolean;
  selectedInteractionKeys?: Set<string>;
}) {
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
      return (
        <ActionsBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
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
      return (
        <FlightOptionsBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
    case 'sales_funnel':
      return <SalesFunnelBlock block={block} />;
    case 'sales_dashboard':
      return <SalesDashboardBlock block={block} />;
    case 'answer_card':
      return <AnswerCardBlock block={block} />;
    case 'source_list':
      return <SourceListBlock block={block} />;
    case 'task_plan':
      return (
        <TaskPlanBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
    case 'confirmation_panel':
      return (
        <ConfirmationPanelBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
    case 'form_fill':
      return (
        <FormFillBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
    case 'choice_picker':
      return (
        <ChoicePickerBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
    case 'diff_preview':
      return (
        <DiffPreviewBlock
          block={block}
          onSubmitInteraction={onSubmitInteraction}
          toolCallId={toolCallId}
          interactionDisabled={interactionDisabled}
          selectedInteractionKeys={selectedInteractionKeys}
        />
      );
    case 'error_diagnosis':
      return <ErrorDiagnosisBlock block={block} />;
    case 'file_attachment_card':
      return <FileAttachmentCardBlock block={block} />;
    case 'progress_tracker':
      return <ProgressTrackerBlock block={block} />;
  }
}

export function DeclarativeRenderer({
  spec,
  status,
  onSubmitInteraction,
  toolCallId,
  interactionDisabled = false,
  selectedInteractionKeys,
}: {
  spec: UISpec;
  status: string;
  onSubmitInteraction?: SubmitInteraction;
  toolCallId?: string;
  interactionDisabled?: boolean;
  selectedInteractionKeys?: Set<string>;
}) {
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
          {interactionDisabled ? (
            <span className="mt-2 inline-flex rounded-full border border-border bg-sidebar-bg px-2 py-0.5 text-[11px] font-medium text-text-secondary">
              Past message - interactions disabled
            </span>
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
          <BlockRenderer
            key={JSON.stringify(block)}
            block={block}
            onSubmitInteraction={onSubmitInteraction}
            toolCallId={toolCallId}
            interactionDisabled={interactionDisabled}
            selectedInteractionKeys={selectedInteractionKeys}
          />
        ))}
      </div>
    </div>
  );
}
