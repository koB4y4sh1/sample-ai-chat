'use client';

import { useFrontendTool } from '@copilotkit/react-core/v2';
import { useCallback, useRef } from 'react';
import {
  type ShowUiSpecArgs,
  showUiSpecSchema,
  type UIBlock,
  type UISpec,
  uiSpecSchema,
} from '../../lib/generative-ui/schemas/declarative';
import {
  type ShowFlightOptionsArgs,
  showFlightOptionsSchema,
} from '../../lib/generative-ui/schemas/flight-options';
import { type ShowMcpAppArgs, showMcpAppSchema } from '../../lib/generative-ui/schemas/open-ended';
import { type ZenithPanelArgs, zenithPanelSchema } from '../../lib/generative-ui/schemas/static';
import { FlightOptions } from '../generative-ui/custom';
import { DeclarativeRenderer } from '../generative-ui/declarative';
import { EmbeddedAppFrame } from '../generative-ui/open-ended';
import { ZenithPanel } from '../generative-ui/static';
import { useGenerativeUIInteraction } from './GenerativeUIInteractionContext';

const fallbackSpec: UISpec = {
  version: '1',
  title: 'Structured UI',
  summary: 'Preparing a declarative response.',
  blocks: [
    {
      type: 'callout',
      tone: 'neutral',
      body: 'The UI schema is being generated.',
    },
  ],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asTone = (value: unknown): 'neutral' | 'positive' | 'warning' =>
  value === 'positive' || value === 'warning' || value === 'neutral' ? value : 'neutral';

const asTrend = (value: unknown): 'up' | 'down' | 'neutral' | undefined =>
  value === 'up' || value === 'down' || value === 'neutral' ? value : undefined;

const pickFirstString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) {
      return value;
    }
  }

  return '';
};

const diffBeforeKeys = ['before', 'from', 'original', 'oldText', 'input', 'source', 'current'];
const diffAfterKeys = [
  'after',
  'to',
  'revised',
  'corrected',
  'edited',
  'proposed',
  'newText',
  'output',
  'updated',
];

const labelLooksLikeBefore = (label: string) => {
  const normalized = label.toLowerCase();
  return (
    normalized.includes('before') ||
    normalized.includes('original') ||
    normalized.includes('old') ||
    normalized.includes('source') ||
    label.includes('\u539f\u6587') ||
    label.includes('\u5909\u66f4\u524d') ||
    label.includes('\u4fee\u6b63\u524d')
  );
};

const labelLooksLikeAfter = (label: string) => {
  const normalized = label.toLowerCase();
  return (
    normalized.includes('after') ||
    normalized.includes('revised') ||
    normalized.includes('corrected') ||
    normalized.includes('edited') ||
    normalized.includes('new') ||
    label.includes('\u6821\u6b63') ||
    label.includes('\u4fee\u6b63\u5f8c') ||
    label.includes('\u5909\u66f4\u5f8c')
  );
};

const normalizeBlocks = (blocks: unknown[]): UIBlock[] =>
  blocks.flatMap((block): UIBlock[] => {
    if (!isRecord(block)) {
      return [];
    }

    const title = asString(block.title) || undefined;

    switch (block.type) {
      case 'metric_grid': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const value = asString(item.value);
              if (!label || !value) {
                return [];
              }

              return [
                {
                  label,
                  value,
                  delta: asString(item.delta) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'metric_grid', title, items }] : [];
      }
      case 'list': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (typeof item === 'string') {
                return [item];
              }

              if (isRecord(item)) {
                const text = asString(item.text) || asString(item.label) || asString(item.value);
                return text ? [text] : [];
              }

              return [];
            })
          : [];

        return items.length > 0
          ? [{ type: 'list', title, ordered: block.ordered === true, items }]
          : [];
      }
      case 'table': {
        const columns = Array.isArray(block.columns)
          ? block.columns.flatMap((column) => (typeof column === 'string' ? [column] : []))
          : [];
        const rows = Array.isArray(block.rows)
          ? block.rows.flatMap((row) =>
              Array.isArray(row)
                ? [row.flatMap((cell) => (typeof cell === 'string' ? [cell] : []))]
                : [],
            )
          : [];

        return columns.length > 0 && rows.length > 0
          ? [{ type: 'table', title, columns, rows }]
          : [];
      }
      case 'callout': {
        const body = asString(block.body);

        return body ? [{ type: 'callout', title, tone: asTone(block.tone), body }] : [];
      }
      case 'actions': {
        const actions = Array.isArray(block.actions)
          ? block.actions.flatMap((action) => {
              if (!isRecord(action)) {
                return [];
              }

              const label = asString(action.label);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  description: asString(action.description) || undefined,
                },
              ];
            })
          : [];

        return actions.length > 0 ? [{ type: 'actions', title, actions }] : [];
      }
      case 'text': {
        const body = asString(block.body);

        return body ? [{ type: 'text', title, body }] : [];
      }
      case 'divider':
        return [{ type: 'divider', title }];
      case 'key_value': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const value = asString(item.value);
              if (!label || !value) {
                return [];
              }

              return [
                {
                  label,
                  value,
                  description: asString(item.description) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'key_value', title, items }] : [];
      }
      case 'progress': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  value: asString(item.value) || undefined,
                  percent: Math.max(0, Math.min(100, asNumber(item.percent))),
                  tone: asTone(item.tone),
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'progress', title, items }] : [];
      }
      case 'checklist': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  description: asString(item.description) || undefined,
                  status: asString(item.status) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'checklist', title, items }] : [];
      }
      case 'timeline': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  description: asString(item.description) || undefined,
                  status: asString(item.status) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'timeline', title, items }] : [];
      }
      case 'comparison': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const from = asString(item.from);
              const to = asString(item.to);
              if (!label || !from || !to) {
                return [];
              }

              return [
                {
                  label,
                  from,
                  to,
                  description: asString(item.description) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'comparison', title, items }] : [];
      }
      case 'risk_matrix': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  likelihood: asString(item.likelihood) || undefined,
                  impact: asString(item.impact) || undefined,
                  score: asString(item.score) || undefined,
                  tone: asTone(item.tone),
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'risk_matrix', title, items }] : [];
      }
      case 'decision': {
        const verdict = asString(block.verdict) || asString(block.value);

        return verdict
          ? [
              {
                type: 'decision',
                title,
                verdict,
                body: asString(block.body) || undefined,
                tone: asTone(block.tone),
              },
            ]
          : [];
      }
      case 'tabs':
      case 'accordion': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const body = asString(item.body) || asString(item.description) || asString(item.text);
              if (!label || !body) {
                return [];
              }

              return [{ label, body }];
            })
          : [];

        return items.length > 0 ? [{ type: block.type, title, items }] : [];
      }
      case 'quote': {
        const body = asString(block.body);

        return body
          ? [{ type: 'quote', title, body, subtitle: asString(block.subtitle) || undefined }]
          : [];
      }
      case 'status_strip': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const value = asString(item.value) || asString(item.status);
              if (!label || !value) {
                return [];
              }

              return [{ label, value, tone: asTone(item.tone) }];
            })
          : [];

        return items.length > 0 ? [{ type: 'status_strip', title, items }] : [];
      }
      case 'flight_card': {
        const from = asString(block.from);
        const to = asString(block.to);

        return from && to
          ? [
              {
                type: 'flight_card',
                title,
                from,
                to,
                status: asString(block.status) || undefined,
                body: asString(block.body) || undefined,
              },
            ]
          : [];
      }
      case 'flight_options': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const airline = asString(item.airline) || asString(item.label);
              const flightNumber = asString(item.flightNumber) || asString(item.value);
              const origin = asString(item.origin) || asString(item.from);
              const destination = asString(item.destination) || asString(item.to);
              const date = asString(item.date);
              const departureTime = asString(item.departureTime);
              const arrivalTime = asString(item.arrivalTime);
              const duration = asString(item.duration);
              const status = asString(item.status);
              const price = asString(item.price);

              if (
                !airline ||
                !flightNumber ||
                !origin ||
                !destination ||
                !date ||
                !departureTime ||
                !arrivalTime ||
                !duration ||
                !status ||
                !price
              ) {
                return [];
              }

              return [
                {
                  id: asString(item.id) || undefined,
                  airline,
                  airlineLogo: asString(item.airlineLogo) || undefined,
                  flightNumber,
                  origin,
                  destination,
                  date,
                  departureTime,
                  arrivalTime,
                  duration,
                  status,
                  price,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'flight_options', title, items }] : [];
      }
      case 'sales_funnel': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const value = asString(item.value);
              if (!label || !value) {
                return [];
              }

              return [
                {
                  label,
                  value,
                  percent: asNumber(item.percent, -1) >= 0 ? asNumber(item.percent) : undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'sales_funnel', title, items }] : [];
      }
      case 'sales_dashboard': {
        const kpis = Array.isArray(block.kpis)
          ? block.kpis.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              const value = asString(item.value);
              if (!label || !value) {
                return [];
              }

              return [
                {
                  label,
                  value,
                  subtitle: asString(item.subtitle) || undefined,
                  trend: asTrend(item.trend),
                  trendValue: asString(item.trendValue) || undefined,
                },
              ];
            })
          : [];
        const regionData = Array.isArray(block.regionData)
          ? block.regionData.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  value: Math.max(0, Math.min(100, asNumber(item.value))),
                  color: asString(item.color) || undefined,
                },
              ];
            })
          : [];
        const monthlyData = Array.isArray(block.monthlyData)
          ? block.monthlyData.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              if (!label) {
                return [];
              }

              return [{ label, value: Math.max(0, asNumber(item.value)) }];
            })
          : [];
        const orders = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const id = asString(item.id);
              const customer = asString(item.customer) || asString(item.label);
              const region = asString(item.region);
              const total = asString(item.total) || asString(item.value);
              const status = asString(item.status);
              if (!id || !customer || !region || !total || !status) {
                return [];
              }

              return [{ id, customer, region, total, status }];
            })
          : [];

        return kpis.length > 0 && regionData.length > 0 && monthlyData.length > 0
          ? [
              {
                type: 'sales_dashboard',
                title: asString(block.periodTitle) || title || 'Sales Dashboard',
                dateRange: asString(block.dateRange) || undefined,
                kpis,
                regionData,
                monthlyData,
                orders,
              },
            ]
          : [];
      }
      case 'answer_card': {
        const body = asString(block.body);
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [{ label, description: asString(item.description) || undefined }];
            })
          : [];

        return body ? [{ type: 'answer_card', title, body, tone: asTone(block.tone), items }] : [];
      }
      case 'source_list': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text) || asString(item.path);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  url: asString(item.url) || undefined,
                  path: asString(item.path) || asString(item.filePath) || undefined,
                  line: asString(item.line) || undefined,
                  description: asString(item.description) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'source_list', title, items }] : [];
      }
      case 'task_plan': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  status: asString(item.status) || undefined,
                  owner: asString(item.owner) || undefined,
                  description: asString(item.description) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'task_plan', title, items }] : [];
      }
      case 'confirmation_panel': {
        const body =
          asString(block.body) || asString(block.description) || asString(block.subtitle);
        const rawActions = Array.isArray(block.actions)
          ? block.actions
          : Array.isArray(block.items)
            ? block.items
            : [];
        const actions = rawActions.flatMap((action) => {
          if (!isRecord(action)) {
            return [];
          }

          const label = asString(action.label) || asString(action.text) || asString(action.value);
          if (!label) {
            return [];
          }

          const variant: 'primary' | 'secondary' | 'danger' | undefined =
            action.variant === 'primary' ||
            action.variant === 'secondary' ||
            action.variant === 'danger'
              ? action.variant
              : undefined;

          return [
            {
              label,
              description: asString(action.description) || undefined,
              tone: asTone(action.tone),
              variant,
            },
          ];
        });

        return body
          ? [{ type: 'confirmation_panel', title, body, tone: asTone(block.tone), actions }]
          : [];
      }
      case 'form_fill': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  value: asString(item.value) || undefined,
                  placeholder: asString(item.placeholder) || undefined,
                  inputType: asString(item.inputType) || undefined,
                  required: item.required === true,
                  status: asString(item.status) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'form_fill', title, items }] : [];
      }
      case 'choice_picker': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  description: asString(item.description) || undefined,
                  status: asString(item.status) || undefined,
                  tone: asTone(item.tone),
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'choice_picker', title, items }] : [];
      }
      case 'diff':
      case 'text_diff':
      case 'revision_diff':
      case 'proofreading_diff':
      case 'diff_preview': {
        const rawItems = Array.isArray(block.items) ? block.items.filter(isRecord) : [];
        const items = rawItems.flatMap((item) => {
          if (!isRecord(item)) {
            return [];
          }

          const label = asString(item.label) || title || 'Diff preview';
          const before = pickFirstString(item, diffBeforeKeys);
          const after = pickFirstString(item, diffAfterKeys);
          if (!before || !after) {
            return [];
          }

          return [
            {
              label,
              before,
              after,
              language: asString(item.language) || undefined,
              description: asString(item.description) || undefined,
            },
          ];
        });
        const beforeFromLabeledItem =
          rawItems
            .filter((item) => labelLooksLikeBefore(asString(item.label)))
            .map((item) => asString(item.value) || asString(item.text) || asString(item.body))
            .find(Boolean) ?? '';
        const afterFromLabeledItem =
          rawItems
            .filter((item) => labelLooksLikeAfter(asString(item.label)))
            .map((item) => asString(item.value) || asString(item.text) || asString(item.body))
            .find(Boolean) ?? '';
        const before = pickFirstString(block, diffBeforeKeys) || beforeFromLabeledItem;
        const after = pickFirstString(block, diffAfterKeys) || afterFromLabeledItem;
        if (items.length === 0 && (before || after || block.body || block.description)) {
          return [
            {
              type: 'diff_preview',
              title,
              items: [
                {
                  label: title ?? 'Diff preview',
                  before: before || 'Before content was not provided.',
                  after: after || 'After content was not provided.',
                  language: asString(block.language) || undefined,
                  description: asString(block.description) || asString(block.body) || undefined,
                },
              ],
            },
          ];
        }

        return items.length > 0 ? [{ type: 'diff_preview', title, items }] : [];
      }
      case 'error_diagnosis': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  severity: asString(item.severity) || asString(item.status) || undefined,
                  cause: asString(item.cause) || undefined,
                  reproduction: asString(item.reproduction) || undefined,
                  fix: asString(item.fix) || undefined,
                  description: asString(item.description) || undefined,
                },
              ];
            })
          : [];
        const body = asString(block.body) || asString(block.description) || undefined;
        const fallbackLabel = title || asString(block.label) || 'Diagnosis';
        if (items.length === 0 && (body || block.cause || block.fix || block.reproduction)) {
          items.push({
            label: fallbackLabel,
            severity: asString(block.severity) || asString(block.tone) || undefined,
            cause: asString(block.cause) || undefined,
            reproduction: asString(block.reproduction) || undefined,
            fix: asString(block.fix) || undefined,
            description: body,
          });
        }

        return items.length > 0 ? [{ type: 'error_diagnosis', title, body, items }] : [];
      }
      case 'file_attachment_card': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.fileName) || asString(item.path);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  fileName: asString(item.fileName) || undefined,
                  filePath: asString(item.filePath) || asString(item.path) || undefined,
                  mimeType: asString(item.mimeType) || undefined,
                  size: asString(item.size) || undefined,
                  status: asString(item.status) || undefined,
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'file_attachment_card', title, items }] : [];
      }
      case 'progress_tracker': {
        const items = Array.isArray(block.items)
          ? block.items.flatMap((item) => {
              if (!isRecord(item)) {
                return [];
              }

              const label = asString(item.label) || asString(item.text);
              if (!label) {
                return [];
              }

              return [
                {
                  label,
                  percent: Math.max(0, Math.min(100, asNumber(item.percent))),
                  status: asString(item.status) || undefined,
                  description: asString(item.description) || undefined,
                  tone: asTone(item.tone),
                },
              ];
            })
          : [];

        return items.length > 0 ? [{ type: 'progress_tracker', title, items }] : [];
      }
      default:
        return [];
    }
  });

const normalizeUiSpec = (value: ShowUiSpecArgs): UISpec => {
  const blocks = normalizeBlocks(value.blocks);
  if (!value.title || blocks.length === 0) {
    return fallbackSpec;
  }

  return {
    version: '1',
    title: value.title,
    summary: value.summary,
    blocks,
  };
};

const resolveUiSpec = (value: unknown): UISpec => {
  const result = uiSpecSchema.safeParse(value);
  if (result.success) {
    return normalizeUiSpec(result.data);
  }

  if (!value || typeof value !== 'object') {
    return fallbackSpec;
  }

  const candidate = {
    version: '1',
    ...value,
  };
  const resultWithDefaultVersion = uiSpecSchema.safeParse(candidate);
  if (!resultWithDefaultVersion.success) {
    return fallbackSpec;
  }

  return normalizeUiSpec(resultWithDefaultVersion.data);
};

const resolveUiSpecArgs = (args: ShowUiSpecArgs | { spec?: unknown }): UISpec => {
  const nestedSpec = resolveUiSpec('spec' in args ? args.spec : undefined);
  if (nestedSpec !== fallbackSpec) {
    return nestedSpec;
  }

  return resolveUiSpec(args);
};

interface GenerativeUIRegistryProps {
  agentId: string;
}

export function GenerativeUIRegistry({ agentId }: GenerativeUIRegistryProps) {
  const { activeToolCallIds, selectedInteractionKeys, submitInteraction } =
    useGenerativeUIInteraction();
  const staticToolDeps = [null, null, null] as const;
  const interactiveToolDeps = [
    activeToolCallIds,
    selectedInteractionKeys,
    submitInteraction,
  ] as const;
  const lastValidUiSpecByToolCallIdRef = useRef(new Map<string, UISpec>());
  const resolveStableUiSpec = useCallback((toolCallId: string, args: ShowUiSpecArgs) => {
    const spec = resolveUiSpecArgs(args);
    if (spec !== fallbackSpec) {
      lastValidUiSpecByToolCallIdRef.current.set(toolCallId, spec);
      return spec;
    }

    return lastValidUiSpecByToolCallIdRef.current.get(toolCallId) ?? spec;
  }, []);

  useFrontendTool<ZenithPanelArgs>(
    {
      name: 'show_zenith_panel',
      agentId,
      description:
        'Render a fixed Zenith status panel. Use this for simple visual summaries, status cards, metrics, and action plans.',
      parameters: zenithPanelSchema,
      followUp: false,
      handler: async (args) => ({
        rendered: true,
        type: 'static',
        title: args.title,
        metricCount: args.metrics.length,
        actionCount: args.nextActions.length,
      }),
      render: ({ args, status }) => (
        <ZenithPanel
          title={args.title ?? 'Zenith Panel'}
          summary={args.summary ?? 'Preparing a structured response.'}
          tone={args.tone ?? 'neutral'}
          metrics={args.metrics ?? []}
          nextActions={args.nextActions ?? []}
          status={status}
        />
      ),
    },
    staticToolDeps,
  );

  useFrontendTool<ShowUiSpecArgs>(
    {
      name: 'show_ui_spec',
      agentId,
      description:
        'Render declarative Generative UI from a versioned UI schema. Available block types: metric_grid, list, table, callout, actions, text, divider, key_value, progress, checklist, timeline, comparison, risk_matrix, decision, tabs, accordion, quote, status_strip, flight_card, flight_options, sales_funnel, sales_dashboard, answer_card, source_list, task_plan, confirmation_panel, form_fill, choice_picker, diff_preview, error_diagnosis, file_attachment_card, progress_tracker. Use chat-business blocks for chat answers, citations, execution plans, confirmations, forms, choices, diffs, diagnostics, attachments, and progress. For diff_preview, always include before/after content; original/corrected/revised aliases are accepted for proofreading. Use flight_options for polished travel search cards and sales_dashboard for a complete KPI dashboard with charts and orders. Choose diverse, high-quality blocks that best fit the user request instead of always using the same layout.',
      parameters: showUiSpecSchema,
      followUp: false,
      handler: async (args) => {
        const spec = resolveUiSpecArgs(args);

        return {
          rendered: true,
          type: 'declarative',
          title: spec.title,
          blockCount: spec.blocks.length,
        };
      },
      render: ({ args, status, toolCallId }) => (
        <DeclarativeRenderer
          spec={resolveStableUiSpec(toolCallId, args)}
          status={status}
          toolCallId={toolCallId}
          interactionDisabled={!activeToolCallIds.has(toolCallId)}
          selectedInteractionKeys={selectedInteractionKeys}
          onSubmitInteraction={submitInteraction}
        />
      ),
    },
    interactiveToolDeps,
  );

  useFrontendTool<ShowFlightOptionsArgs>(
    {
      name: 'show_flight_options',
      agentId,
      description:
        'Render polished flight search result cards. Use this instead of returning JSON or show_ui_spec when the user asks for flight options, travel search results, airline cards, or SFO to JFK style flight listings.',
      parameters: showFlightOptionsSchema,
      followUp: false,
      handler: async (args) => ({
        rendered: true,
        type: 'flight-options',
        title: args.title,
        flightCount: args.flights?.length ?? 0,
      }),
      render: ({ args, toolCallId }) => (
        <FlightOptions
          title={args.title ?? 'Flight options'}
          summary={args.summary}
          flights={args.flights ?? []}
          disabled={!activeToolCallIds.has(toolCallId)}
          selectedFlightKeys={selectedInteractionKeys}
          toolCallId={toolCallId}
          onSelect={(flight) =>
            submitInteraction(
              [
                'Selected flight option.',
                `Flight: ${flight.airline} ${flight.flightNumber}`,
                `Route: ${flight.origin} to ${flight.destination}`,
                `Departure: ${flight.date} ${flight.departureTime}`,
                `Arrival: ${flight.arrivalTime}`,
                `Price: ${flight.price}`,
                `Status: ${flight.status}`,
              ].join('\n'),
              {
                toolCallId,
                interactionKey: `flight:${flight.id ?? `${flight.airline}-${flight.flightNumber}`}`,
              },
            )
          }
        />
      ),
    },
    interactiveToolDeps,
  );

  useFrontendTool<ShowMcpAppArgs>(
    {
      name: 'show_mcp_app',
      agentId,
      description:
        'Render an open-ended MCP App style surface in a sandboxed iframe. Use this for interactive embedded app experiences that do not fit the predefined static or declarative UI blocks.',
      parameters: showMcpAppSchema,
      followUp: false,
      handler: async (args) => ({
        rendered: true,
        type: 'open-ended',
        appId: args.appId,
        title: args.title,
      }),
      render: ({ args }) => (
        <EmbeddedAppFrame
          appId={args.appId ?? 'project-dashboard'}
          title={args.title ?? 'Embedded App'}
          prompt={args.prompt}
          height={args.height ?? 420}
        />
      ),
    },
    staticToolDeps,
  );

  return null;
}
