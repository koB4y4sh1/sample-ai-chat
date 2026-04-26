'use client';

import { useFrontendTool } from '@copilotkit/react-core/v2';
import {
  type ShowUiSpecArgs,
  showUiSpecSchema,
  type UIBlock,
  type UISpec,
  uiSpecSchema,
} from '../../lib/generative-ui/schemas/declarative';
import { type ShowMcpAppArgs, showMcpAppSchema } from '../../lib/generative-ui/schemas/open-ended';
import { type ZenithPanelArgs, zenithPanelSchema } from '../../lib/generative-ui/schemas/static';
import { DeclarativeRenderer } from '../generative-ui/declarative';
import { EmbeddedAppFrame } from '../generative-ui/open-ended';
import { ZenithPanel } from '../generative-ui/static';

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
        const tone =
          block.tone === 'positive' || block.tone === 'warning' || block.tone === 'neutral'
            ? block.tone
            : 'neutral';
        const body = asString(block.body);

        return body ? [{ type: 'callout', title, tone, body }] : [];
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

export function GenerativeUIRegistry() {
  useFrontendTool<ZenithPanelArgs>(
    {
      name: 'show_zenith_panel',
      agentId: 'zenith',
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
    [],
  );

  useFrontendTool<ShowUiSpecArgs>(
    {
      name: 'show_ui_spec',
      agentId: 'zenith',
      description:
        'Render declarative Generative UI from a versioned UI schema. Use this for flexible dashboards, tables, metric grids, lists, callouts, and action groups.',
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
      render: ({ args, status }) => (
        <DeclarativeRenderer spec={resolveUiSpecArgs(args)} status={status} />
      ),
    },
    [],
  );

  useFrontendTool<ShowMcpAppArgs>(
    {
      name: 'show_mcp_app',
      agentId: 'zenith',
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
    [],
  );

  return null;
}
