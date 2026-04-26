import { z } from 'zod';

export const uiBlockSchema = z.object({
  type: z
    .enum(['metric_grid', 'list', 'table', 'callout', 'actions'])
    .describe('The UI block type to render.'),
  title: z.string().optional().describe('Optional block title.'),
  tone: z.enum(['neutral', 'positive', 'warning']).optional().describe('Callout tone.'),
  body: z.string().optional().describe('Callout body text.'),
  ordered: z.boolean().optional().describe('Whether a list block should be ordered.'),
  items: z
    .array(
      z.object({
        label: z.string().optional(),
        value: z.string().optional(),
        delta: z.string().optional(),
        text: z.string().optional(),
      }),
    )
    .optional()
    .describe('Metric grid items or list items. For lists, set text.'),
  columns: z.array(z.string()).optional().describe('Table column labels.'),
  rows: z.array(z.array(z.string())).optional().describe('Table rows.'),
  actions: z
    .array(
      z.object({
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional()
    .describe('Action items for an actions block.'),
});

export const uiSpecSchema = z.object({
  version: z.literal('1').describe('The UI schema version. Always use "1".'),
  title: z.string().describe('The title of the rendered UI.'),
  summary: z.string().optional().describe('Short summary shown under the title.'),
  blocks: z.array(uiBlockSchema).min(1).max(8).describe('UI blocks to render.'),
});

export const showUiSpecSchema = uiSpecSchema;

export type MetricGridBlock = {
  type: 'metric_grid';
  title?: string;
  items: Array<{
    label: string;
    value: string;
    delta?: string;
  }>;
};

export type ListBlock = {
  type: 'list';
  title?: string;
  ordered?: boolean;
  items: string[];
};

export type TableBlock = {
  type: 'table';
  title?: string;
  columns: string[];
  rows: string[][];
};

export type CalloutBlock = {
  type: 'callout';
  tone: 'neutral' | 'positive' | 'warning';
  title?: string;
  body: string;
};

export type ActionsBlock = {
  type: 'actions';
  title?: string;
  actions: Array<{
    label: string;
    description?: string;
  }>;
};

export type UIBlock = MetricGridBlock | ListBlock | TableBlock | CalloutBlock | ActionsBlock;

export type UISpec = {
  version: '1';
  title: string;
  summary?: string;
  blocks: UIBlock[];
};

export type ShowUiSpecArgs = z.infer<typeof showUiSpecSchema>;
